declare module "heic-convert" {
  interface ConvertOptions {
    buffer: Buffer;
    format: "PNG" | "JPEG";
    quality?: number;
  }
  export default function convert(options: ConvertOptions): Promise<Buffer>;
}
