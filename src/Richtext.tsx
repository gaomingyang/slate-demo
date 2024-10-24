import React, { Children, CSSProperties, useCallback, useMemo, useState } from "react";
import isHotkey from "is-hotkey";
import {
  Editable,
  withReact,
  useSlate,
  Slate,
  RenderElementProps,
  RenderLeafProps,
} from "slate-react";
import {
  Editor,
  Transforms,
  createEditor,
  Descendant,
  Element as SlateElement,
  BaseText,
  BaseElement,
  BaseEditor,
  Text,
} from "slate";
import { withHistory } from "slate-history";
import { Button, Icon, Toolbar } from "./Components";

type Format = "bold" | "italic" | "underline" | "code";

type CustomText = BaseText & {
  bold?: boolean;
  code?: boolean;
  italic?: boolean;
  underline?: boolean;
};

type CustomElement = BaseElement & {
  align?: string;
  type: string;
};

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

const HOTKEYS = {
  "mod+b": "bold",
  "mod+i": "italic",
  "mod+u": "underline",
  "mod+`": "code",
  "mod+shift+b": "binary-code",
} as {
  [key: string]: Format | string;
};

const LIST_TYPES = ["numbered-list", "bulleted-list"];
const TEXT_ALIGN_TYPES = ["left", "center", "right", "justify"];

const RichTextExample = () => {
  const renderElement = useCallback(
    (props: RenderElementProps) => <Element {...props} />,
    []
  );
  const renderLeaf = useCallback(
    (props: RenderLeafProps) => <Leaf {...props} />,
    []
  );
  const editor = useMemo(() => {
    const e = withHistory(withReact(createEditor()));

    //Normalizing  https://docs.slatejs.org/concepts/11-normalizing

    //original normalizeNode
    const { normalizeNode } = e;

    e.normalizeNode = (entry) => {
      const [node, path] = entry;

      //only work for binary-code block
      if (SlateElement.isElement(node) && node.type === 'binary-code') {
        for (const [child, childPath] of Editor.nodes(e, { at: path })) {
          if (Text.isText(child)) {
            //replace not 0,1 to empty and then insert to node
            const newText = child.text.replace(/[^01]/g, '')
            if (newText !== child.text) {
              Transforms.insertText(e, newText, { at: childPath })
            }
          }
        }
      }

      //call original normalizeNode
      normalizeNode(entry);
    }


    return e;
  }, []);



  const handleOnKeyDown = (event: React.KeyboardEvent) => {
    console.log("event.key:" + event.key)
    if (event.key === '&') {
      event.preventDefault()
      editor.insertText('and')
    }

    //trigger hotkey
    for (const hotkey in HOTKEYS) {
      if (isHotkey(hotkey, event as any)) {
        event.preventDefault();
        const mark = HOTKEYS[hotkey];
        console.log("mark:" + mark);
        if (mark === "binary-code") {
          toggleBlock(editor, mark)
        } else {
          toggleMark(editor, mark as Format);
        }
      }
    }


  }

  return (
    <Slate editor={editor} initialValue={initialValue}>
      <Toolbar>
        <MarkButton format="bold" icon="format_bold" />
        <MarkButton format="italic" icon="format_italic" />
        <MarkButton format="underline" icon="format_underlined" />
        <MarkButton format="code" icon="code" />
        <BlockButton format="heading-one" icon="looks_one" />
        <BlockButton format="heading-two" icon="looks_two" />
        <BlockButton format="block-quote" icon="format_quote" />
        <BlockButton format="numbered-list" icon="format_list_numbered" />
        <BlockButton format="bulleted-list" icon="format_list_bulleted" />
        <BlockButton format="left" icon="format_align_left" />
        <BlockButton format="center" icon="format_align_center" />
        <BlockButton format="right" icon="format_align_right" />
        <BlockButton format="justify" icon="format_align_justify" />
        <BlockButton format="binary-code" icon="code" />
      </Toolbar>
      <Editable
        style={{ outline: "none" }}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        placeholder="Enter some rich text…"
        spellCheck
        autoFocus
        onKeyDown={handleOnKeyDown}

      />
    </Slate>
  );
};

const toggleBlock = (editor: Editor, format: string) => {
  const isActive = isBlockActive(
    editor,
    format,
    TEXT_ALIGN_TYPES.includes(format) ? "align" : "type"
  );
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes(n.type) &&
      !TEXT_ALIGN_TYPES.includes(format),
    split: true,
  });
  let newProperties: Partial<SlateElement>;
  if (TEXT_ALIGN_TYPES.includes(format)) {
    newProperties = {
      align: isActive ? undefined : format,
    };
  } else {
    newProperties = {
      type: isActive ? "paragraph" : isList ? "list-item" : format,
    };
  }
  Transforms.setNodes<SlateElement>(editor, newProperties);

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

const toggleMark = (editor: Editor, format: Format) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const isBlockActive = (
  editor: Editor,
  format: string,
  blockType: "align" | "type" = "type"
) => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        n[blockType] === format,
    })
  );

  return !!match;
};

const isMarkActive = (
  editor: Editor,
  format: "bold" | "italic" | "underline" | "code"
) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

type ElementProps = {
  attributes: object;
  children: React.ReactNode;
  element: SlateElement;
};



const Element = ({ attributes, children, element }: ElementProps) => {
  const editor = useSlate();
  const style = { textAlign: element.align as CSSProperties["textAlign"] };

  // change binary to string
  const binaryToString = (binary: string): string => {
    return binary
      .match(/.{1,8}/g)
      ?.map((byte) => String.fromCharCode(parseInt(byte, 2)))
      .join('') || '';
  };

  //tooltip
  const [tooltip, setTooltip] = useState({ visible: false, text: "", x: 0, y: 0 })

  const handleBinaryCodeMouseEnter = (event: React.MouseEvent, children: React.ReactNode) => {
    if (!children) return;
    //get binary text
    const binaryText = React.Children.map(children, (child) => {
      if (typeof child === "object" && child && 'props' in child && 'text' in child.props) {
        return child.props.text.text;
      }
      return '';
    })?.join("").replace(/\s+/g, "");

    // console.log("binaryText:", binaryText);

    if (binaryText) {
      const asciiContent = binaryToString(binaryText);
      console.log("asciiContent:", asciiContent);

      setTooltip({
        visible: true,
        text: asciiContent,
        x: event.clientX,
        y: event.clientY,
      });
    }
  };

  const handleBinaryCodeMouseLeave = () => {
    // console.log("mouse leave binary code")
    setTooltip({ visible: false, text: '', x: 0, y: 0 })
  }

  //click 1 or 0 button
  const handleClickBinaryCodeBtn = (value: string) => {
    console.log("clicked " + value)
    const { selection } = editor;
    console.log("selection:" + selection)
    if (!selection) {
      return;
    }

    // Transforms.insertText(editor, value); //inset at cursor position

    //insert at end of block
    const [binaryCodeNodeEntry] = Editor.nodes(editor, {
      match: n => SlateElement.isElement(n) && n.type === 'binary-code',
    });
    if (binaryCodeNodeEntry) {
      const [, path] = binaryCodeNodeEntry;
      const endOfBlock = Editor.end(editor, path); // get end of the block
      Transforms.insertText(editor, value, { at: endOfBlock });
    }

  }



  switch (element.type) {
    case "block-quote":
      return (
        <blockquote style={style} {...attributes}>
          {children}
        </blockquote>
      );
    case "bulleted-list":
      return (
        <ul style={style} {...attributes}>
          {children}
        </ul>
      );
    case "heading-one":
      return (
        <h1 style={style} {...attributes}>
          {children}
        </h1>
      );
    case "heading-two":
      return (
        <h2 style={style} {...attributes}>
          {children}
        </h2>
      );
    case "list-item":
      return (
        <li style={style} {...attributes}>
          {children}
        </li>
      );
    case "numbered-list":
      return (
        <ol style={style} {...attributes}>
          {children}
        </ol>
      );
    case "binary-code":
      return (
        <>
          <div >
            <button className="binaryCodeBtn" onClick={() => handleClickBinaryCodeBtn("1")}>1</button>
            <button className="binaryCodeBtn" onClick={() => handleClickBinaryCodeBtn("0")}>0</button>
          </div>

          <pre className="binary-code" style={style} {...attributes}
            onMouseEnter={(event) => handleBinaryCodeMouseEnter(event, children)}
            onMouseLeave={handleBinaryCodeMouseLeave}
          >
            {children}
          </pre>

          {tooltip.visible && (
            <span style={{
              position: "fixed",
              left: tooltip.x,
              top: tooltip.y,
              backgroundColor: "#000",
              color: "#fff",
              padding: "2px",

            }}>{tooltip.text}</span>
          )}
        </>

      );
    default:
      return (
        <p style={style} {...attributes}>
          {children}
        </p>
      );
  }
};

type LeafProps = {
  attributes: object;
  children: React.ReactNode;
  leaf: Text;
};

const Leaf = ({ attributes, children, leaf }: LeafProps) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.code) {
    children = <code>{children}</code>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  return <span {...attributes}>{children}</span>;
};

type BlockButtonProps = {
  format: string;
  icon: string;
};

const BlockButton = ({ format, icon }: BlockButtonProps) => {
  const editor = useSlate();
  return (
    <Button
      active={isBlockActive(
        editor,
        format,
        TEXT_ALIGN_TYPES.includes(format) ? "align" : "type"
      )}
      onMouseDown={(event: React.MouseEvent) => {
        event.preventDefault();
        toggleBlock(editor, format);
      }}
    >
      <Icon>{icon}</Icon>
    </Button>
  );
};

type MarkButtonProps = {
  format: Format;
  icon: string;
};

const MarkButton = ({ format, icon }: MarkButtonProps) => {
  const editor = useSlate();
  return (
    <Button
      active={isMarkActive(editor, format)}
      onMouseDown={(event: React.MouseEvent) => {
        event.preventDefault();
        toggleMark(editor, format);
      }}
    >
      <Icon>{icon}</Icon>
    </Button>
  );
};

const initialValue: Descendant[] = [
  {
    type: "paragraph",
    children: [
      { text: "This is editable " },
      { text: "rich", bold: true },
      { text: " text, " },
      { text: "much", italic: true },
      { text: " better than a " },
      { text: "<textarea>", code: true },
      { text: "!" },
    ],
  },
  {
    type: "binary-code",
    children: [
      { text: "0110100001101001" }
    ]
  },
  {
    type: "paragraph",
    children: [
      { text: "01001000 01100101 01101100 01101100 01101111 01010111 01101111 01110010 01101100 01100100" }
    ]
  },
  {
    type: "paragraph",
    children: [
      {
        text: "Since it's rich text, you can do things like turn a selection of text ",
      },
      { text: "bold", bold: true },
      {
        text: ", or add a semantically rendered block quote in the middle of the page, like this:",
      },
    ],
  },
  {
    type: "block-quote",
    children: [{ text: "A wise quote." }],
  },
  {
    type: "paragraph",
    align: "center",
    children: [{ text: "Try it out for yourself!" }],
  },
] as unknown as Descendant[];

export default RichTextExample;
