declare module "html-to-docx" {
  export default function HTMLtoDOCX(
    htmlString: string,
    headerHTMLString?: string | null,
    options?: Record<string, unknown>
  ): Promise<Buffer>;
}
