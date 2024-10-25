import React, { CSSProperties,useState,forwardRef,useEffect } from 'react';
import {
    useSlate,
    ReactEditor,
  } from "slate-react";
import {
    Editor,
    Transforms,
    Element as SlateElement,
  } from "slate";

type BinaryCodeBlockProps = {
  attributes: object;
  children: React.ReactNode;
  element: SlateElement;
};

const BinaryCodeBlock = forwardRef<HTMLPreElement,BinaryCodeBlockProps>(({ attributes, children, element }, ref) => {
  const editor = useSlate();
  const style = element.align ? { textAlign: element.align as CSSProperties["textAlign"] } : {};

  //tooltip
  const [tooltip, setTooltip] = useState({ visible: false, text: ""});
  const [tooltipPosition, setTooltipPosition] = useState({x: 0, y: 0 });

  //focus
  const [isFocused, setIsFocused] = useState(false);

  const [codeDisplay, setCodeDisplay] = useState('inline');
  const [rightPadding, setRightPadding] = useState(0);
 
  useEffect(()=>{
  



    const handleWindowResize = () => {
      console.log("handleWindowResize")

      //get single char width
      let charWidth = 0;
      const codeContainer = document.querySelector('.binary-code > code ') as HTMLElement;; //get code
      const codeWidth = codeContainer ? codeContainer.offsetWidth : 0; 
      const codeLength = codeContainer ? (codeContainer.textContent?.length ||0) : 0; //code number
      if (codeLength === 0) {
        setRightPadding(0);
        return
      }
      if (codeLength > 0) {
        charWidth = codeWidth / codeLength
        console.log("codeContainerWidth:"+codeWidth+",codelength:"+codeLength +",get single code char Width:"+charWidth); //单个字符宽度
      }


      const containers = document.querySelectorAll('.binary-code');  //get binary-code block
      containers.forEach((container) => {
        const codeContainer = container.querySelector('code') as HTMLElement; //get code element
        if (!container || !codeContainer) return;
  
        const containerWidth = container.clientWidth;
        console.log("binary-code block containerWidth:"+containerWidth);

        let codeWidth = codeContainer ? codeContainer.offsetWidth : 0;  //code width
        let codeLength = codeContainer ? (codeContainer.textContent?.length ||0) : 0; //code number
        console.log("codewidth:"+codeWidth+",codelength:"+codeLength)

        const maxCharNumber = Math.floor(containerWidth / charWidth);
        const maxCharLength = Math.floor(maxCharNumber / 8) * 8;
        const limitCodeWidth = maxCharLength * charWidth;
  
        const paddingNeeded = containerWidth - limitCodeWidth;
        console.log("paddingNeeded:"+paddingNeeded);
        setRightPadding(paddingNeeded > 0 ? paddingNeeded : 0);
        setCodeDisplay("block");
      });

      // const codeContainer = document.querySelector('.binary-code > code ') as HTMLElement;; //get code
      // const codeWidth = codeContainer ? codeContainer.offsetWidth : 0; 
      // const codeLength = codeContainer ? (codeContainer.textContent?.length ||0) : 0; //code number
      // if (codeLength === 0) {
      //   setRightPadding(0);
      //   return
      // }

      // const containerWidth = container? container.clientWidth : 0;
      // const charWidth = codeWidth / codeLength;

      // //最大容纳字符数：
      // const maxCharNumber = containerWidth/charWidth
      // console.log("maxCharNumber:"+maxCharNumber)
      
      //code允许的最大长度
      // const maxCharLength = Math.ceil(maxCharNumber/8)*8
      // const limitCodeWidth = maxCharLength*charWidth;
      // console.log("limitCodeWidth:"+limitCodeWidth)

      //剩下字符长度
      // let paddingNeeded  = containerWidth-limitCodeWidth
      // console.log("paddingNeeded:"+paddingNeeded)
      // setRightPadding(paddingNeeded);
    };

    // Initial adjustment
    handleWindowResize();

    window.addEventListener('resize', handleWindowResize);

    //clearup on unmount
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  },[])

  useEffect(()=>{

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
      });
    }
  },[children])

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
        
      });

      setTooltipPosition({
        x: event.clientX,
        y: event.clientY,
      })
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
    // const [binaryCodeNodeEntry] = Editor.nodes(editor, {
    //   match: n => SlateElement.isElement(n) && n.type === 'binary-code',
    // });

    const path = ReactEditor.findPath(editor as any, element);
      const endOfBlock = Editor.end(editor, path); // get end of the block
      Transforms.insertText(editor, value, { at: endOfBlock });
    

    

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
        <code style={{paddingRight:rightPadding, display: codeDisplay}}>
            
            {/* {isFocused ? "is focused" : children} */}

            {isFocused ? React.Children.map(children,(child) => {
                // console.log("child");
                // console.log(child);
                if (React.isValidElement(child) && typeof child.props.text.text === "string") {
                    const content = child.props.text.text
                    console.log("content:"+content)
                    return content.split('').map((char:string,index:number)=>(
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
