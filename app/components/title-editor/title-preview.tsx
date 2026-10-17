import type { CSSProperties } from "react";
import type { TitleState } from "./types";

interface TitlePreviewProps {
  state: TitleState;
  onTextChange: (text: string) => void;
}

function toStyle(s: TitleState): CSSProperties {
  const decorations = [s.underline && "underline", s.strike && "line-through"]
    .filter(Boolean)
    .join(" ");

  return {
    fontFamily: s.font,
    fontSize: s.size,
    fontWeight: s.bold ? 700 : 400,
    fontStyle: s.italic ? "italic" : "normal",
    textDecoration: decorations || "none",
    color: s.color,
    backgroundColor: s.highlight ?? "transparent",
    textAlign: s.align,
  };
}

export function TitlePreview({ state, onTextChange }: TitlePreviewProps) {
  const Tag = state.block;

  let content = (
    <Tag
      contentEditable={state.editing}
      suppressContentEditableWarning
      onBlur={(e) => onTextChange(e.currentTarget.innerText)}
      style={toStyle(state)}
      className="outline-none"
    >
      {state.text}
    </Tag>
  );

  if (state.link) {
    content = (
      <a href={state.link} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  if (state.list === "ul") {
    return <ul className="list-disc pl-8"><li>{content}</li></ul>;
  }
  if (state.list === "ol") {
    return <ol className="list-decimal pl-8"><li>{content}</li></ol>;
  }
  return content;
}
