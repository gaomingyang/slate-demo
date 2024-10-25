import React, { CSSProperties,useState,forwardRef } from 'react';
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

const BinaryCodeBlock = forwardRef<HTMLPreElement,BinaryCodeBlockProps>(({ attributes, children, element }, ref) => {
  const editor = useSlate();
  const style = { textAlign: element.align as CSSProperties["textAlign"] };

  //tooltip
  const [tooltip, setTooltip] = useState({ visible: false, text: "", x: 0, y: 0 });

  //focus
  const [isFocused, setIsFocused] = useState(false);

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

  const handleFocus = () => {
    console.log("is focus")
    setIsFocused(true);
  }
  const handleBlur = () =>{
    console.log("is blur");
    setIsFocused(false);
  }

  return (
    <>
      <div>
        <button className="binaryCodeBtn" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={() => handleClickBinaryCodeBtn("1")}>1</button>
        <button className="binaryCodeBtn" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={() => handleClickBinaryCodeBtn("0")}>0</button>
      </div>
      <pre
        ref={ref}
        className="binary-code"
        style={style}
        {...attributes}
        onMouseEnter={(event) => handleBinaryCodeMouseEnter(event, children)}
        onMouseLeave={handleBinaryCodeMouseLeave}
        tabIndex={0}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        <code>
            
            {/* {isFocused ? "is focused" : children} */}

            {isFocused ? React.Children.map(children,(child) => {
                console.log("child");
                console.log(child);
                if (React.isValidElement(child) && typeof child.props.text.text === "string") {
                    console.log("is string")
                    const content = child.props.text.text
                    console.log(content)
                    return content.split('').map((char,index)=>(
                        <span key = {index} style= {{ color: char === '1' ? 'green' : char === '0' ? 'red' : 'inherit'}}> {char} </span>
                    ));
                }
                return child;
            }) : children}
            
            
            </code>
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
});

export default BinaryCodeBlock;
