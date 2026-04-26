declare module "markdown-it" {
  type MarkdownItOptions = {
    html?: boolean;
    linkify?: boolean;
    breaks?: boolean;
    highlight?: (code: string, language: string) => string;
  };

  export default class MarkdownIt {
    constructor(options?: MarkdownItOptions);
    render(content: string): string;
  }
}
