import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { readFile, readdir } from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import Handlebars from "handlebars";
import puppeteer, { type Browser } from "puppeteer";
import { STORAGE_SETTINGS } from "../../../common/settings/storage.settings.js";
import { FileStorageService } from "../../../infrastructure/storage/file-storage.service.js";
import type { AttestationData } from "../types/attestation.types.js";
import { pdf as pdfToImg } from "pdf-to-img";

const TEMPLATES_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../templates",
);

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

@Injectable()
export class AttestationPdfService implements OnModuleDestroy {
  private readonly logger = new Logger(AttestationPdfService.name);
  private readonly hbs = Handlebars.create();

  private browser: Browser | null = null;
  private template: Handlebars.TemplateDelegate | null = null;
  private logoDataUri: string | null = null;

  constructor(private readonly fileStorage: FileStorageService) {
    this.registerHelpers();
  }

  async onModuleDestroy(): Promise<void> {
    await this.browser?.close().catch(() => undefined);
    this.browser = null;
  }

  /**
   * Génère le PDF puis délègue la sauvegarde au FileStorageService.
   * @returns chemin relatif à STORAGE_ROOT (à stocker en base)
   */
  async generateAndSave(data: AttestationData): Promise<string> {
    const buffer = await this.generateBuffer(data);
    return this.fileStorage.savePdf(
      { buffer, name: data.reference },
      "attestation",
    );
  }

  async generateBuffer(data: AttestationData): Promise<Buffer> {
    const html = await this.renderHtml(data);
    return this.htmlToPdf(html);
  }

  async renderFirstPageAsPng(pdf: Buffer): Promise<Buffer> {
    const document = await pdfToImg(pdf, { scale: 2 });
    const page = await document.getPage(1);
    return Buffer.from(page);
  }

  async delete(relativePath: string): Promise<void> {
    await this.fileStorage.deletePdf(relativePath);
  }


  private registerHelpers(): void {
    this.hbs.registerHelper("eq", (a: unknown, b: unknown) => a === b);
    this.hbs.registerHelper("trim", (value?: string | null) => value?.trim() ?? "");

    this.hbs.registerHelper("civilite", (sexe?: string) => {
      const s = (sexe ?? "").trim().toUpperCase();
      return s.startsWith("F") ? "Madame" : "Monsieur";
    });
  }

  private async getTemplate(): Promise<Handlebars.TemplateDelegate> {
    if (this.template) return this.template;

    const partialsDir = join(TEMPLATES_DIR, "partials");
    for (const file of await readdir(partialsDir)) {
      if (extname(file) !== ".hbs") continue;
      const name = basename(file, ".hbs"); 
      const source = await readFile(join(partialsDir, file), "utf-8");
      this.hbs.registerPartial(name, source);
    }

    const main = await readFile(join(TEMPLATES_DIR, "attestation.hbs"), "utf-8");
    this.template = this.hbs.compile(main);
    return this.template;
  }

  private async renderHtml(data: AttestationData): Promise<string> {
    const template = await this.getTemplate();

    return template({
      ...data,
      logoCem: await this.getLogo(),
      image: await this.toDataUri(data.image),
      date: new Date(data.datePEC).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",

      }),
    });
  }


  private async getLogo(): Promise<string> {
    if (this.logoDataUri) return this.logoDataUri;
    const buffer = await readFile(join(TEMPLATES_DIR, "assets", "cem-2026.jpg"));
    this.logoDataUri = `data:image/jpeg;base64,${buffer.toString("base64")}`;
    return this.logoDataUri;
  }

  private async toDataUri(relativePath?: string | null): Promise<string | null> {
    if (!relativePath) return null;

    if (isAbsolute(relativePath)) return null;
    const absolute = resolve(STORAGE_SETTINGS.root, relativePath);
    const fromRoot = relative(STORAGE_SETTINGS.root, absolute);
    if (fromRoot === ".." || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) return null;

    const mime = MIME_BY_EXT[extname(absolute).toLowerCase()];
    if (!mime) return null;

    try {
      const buffer = await readFile(absolute);
      return `data:${mime};base64,${buffer.toString("base64")}`;
    } catch {
      this.logger.warn(`Image introuvable: ${relativePath}`);
      return null;
    }
  }


  private async getBrowser(): Promise<Browser> {
    if (this.browser?.connected) return this.browser;

    this.browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
    return this.browser;
  }

  private async htmlToPdf(html: string): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
        await page.setContent(html, { waitUntil: "load" });
        await page.waitForNetworkIdle({ idleTime: 500 });
        await page.evaluate(() => document.fonts.ready);
        await page.emulateMediaType("print");

      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });
      return Buffer.from(pdf);
    } finally {
      await page.close().catch(() => undefined);
    }
  }
}
