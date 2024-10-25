import React, { useState } from 'react';
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

type BinaryCodeBlockProps = {
  attributes: object;
  children: React.ReactNode;
  element: SlateElement;
};

const BinaryCodeBlock = ({ attributes, children, element }: BinaryCodeBlockProps) => {
  const editor = useSlate();
  //tooltip
  const [tooltip, setTooltip] = useState({ visible: false, text: "", x: 0, y: 0 });

  // change binary to string
  const binaryToString = (binary: string): string => {
    return binary
      .match(/.{1,8}/g)
      ?.map((byte) => String.fromCharCode(parseInt(byte, 2)))
      .join('') || '';
  };

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
      //console.log("asciiContent:", asciiContent);
      
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
    setTooltip({ visible: false, text: '', x: 0, y: 0 });
  };

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
  };

  return (
    <>
      <div>
        <button className="binaryCodeBtn" onClick={() => handleClickBinaryCodeBtn("1")}>1</button>
        <button className="binaryCodeBtn" onClick={() => handleClickBinaryCodeBtn("0")}>0</button>
      </div>
      <pre
        className="binary-code"
        style={{ textAlign: element.align }}
        {...attributes}
        onMouseEnter={(event) => handleBinaryCodeMouseEnter(event, children)}
        onMouseLeave={handleBinaryCodeMouseLeave}
        tabIndex={0}
      >
        <code>{children}</code>
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
};

export default BinaryCodeBlock;
