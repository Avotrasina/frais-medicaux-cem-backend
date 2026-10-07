-- AlterTable
CREATE SEQUENCE "personnel".conjoints_num_conjoint_seq;
ALTER TABLE "personnel"."conjoints" ALTER COLUMN "num_conjoint" SET DEFAULT nextval('"personnel".conjoints_num_conjoint_seq');
ALTER SEQUENCE "personnel".conjoints_num_conjoint_seq OWNED BY "personnel"."conjoints"."num_conjoint";

-- AlterTable
CREATE SEQUENCE "personnel".enfants_num_enfant_seq;
ALTER TABLE "personnel"."enfants" ALTER COLUMN "num_enfant" SET DEFAULT nextval('"personnel".enfants_num_enfant_seq');
ALTER SEQUENCE "personnel".enfants_num_enfant_seq OWNED BY "personnel"."enfants"."num_enfant";
