export type BlockTag = "h1" | "h2" | "h3" | "p";
export type Align = "left" | "center" | "right" | "justify";
export type ListType = "none" | "ul" | "ol";

export interface TitleState {
  text: string;
  block: BlockTag;
  font: string;
  size: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  color: string;
  highlight: string | null;
  align: Align;
  list: ListType;
  link: string;
  applyToSite: boolean;
  editing: boolean;
}

export type TitleAction =
  | { type: "patch"; patch: Partial<TitleState> }
  | { type: "reset" };
