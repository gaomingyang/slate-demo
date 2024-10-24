# Overall Task

Add a "Binary Code" element to the rich text editor. The element should behave similarly to the existing Quote element, but is focused on inputting only 1's and 0's

# Features

1. The binary code block has a grey background, black outline, rounded corners, and monospace font.
2. The binary code block can be created using the toolbar OR using a keyboard shortcut.
3. When hovering over the binary code block, a tooltip is shown near the cursor that gives the string equivalent of the binary input, interpreted as ascii (e.g., if the code block contains "0110100001101001", then the tooltip should contain "hi").
4. At the top of the binary code block, there are two buttons: a '1' button and a '0' button. When you click these buttons, a '1' or '0' is inserted at the end of the code block. (see [Slate text transforms docs](https://docs.slatejs.org/concepts/04-transforms#text-transforms))
5. The binary code block only accepts '1' and '0' characters, any other input is removed using the slate normalization process (see [Slate normalization docs](https://docs.slatejs.org/concepts/11-normalizing))
6. (Optional) When resizing the browser window (i.e., responsive design), right-padding is automatically adjusted so the number characters on a single line of the code block is always a multiple of 8.
7. (Optional) If the user types "``` " (i.e., three backticks followed by a space) at the start of an empty paragraph, it will create a code block.
8. (Optional) When the binary code block is focused, the 1's are shown in green and the 0's are shown in red.

# Sharing

- Please push your final code to a GitHub repo, you may also created a hosted version of your code online somewhere (e.g., using GitHub pages) for easy testing.

# Notes

- The optional features will likely take significantly more time, only if you find the other requirements go very quickly, you could try to implement 1-2 of those.
- If you have any questions, or are unsure about how to proceed with part of the task, feel free to email me!

# Links

- [Starting code](https://github.com/matthewlst/slate-demo)
  - This is based on the [Slate richtext demo code](https://github.com/ianstormtaylor/slate/blob/main/site/examples/ts/richtext.tsx)
- [Slate demo site](https://www.slatejs.org/examples/richtext)
- [Slate docs](https://docs.slatejs.org/)
