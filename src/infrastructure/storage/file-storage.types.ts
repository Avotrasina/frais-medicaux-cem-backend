export type StorableImage = {
  buffer: Buffer;
  mimetype: string;
};

export type StorablePdf = {
  buffer: Buffer;
  name?: string;
};
