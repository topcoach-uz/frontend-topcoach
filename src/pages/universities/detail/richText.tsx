import React, { useEffect, useRef } from 'react';
import EditorJS from '@editorjs/editorjs';

// Define a type for the data passed into the editor
interface RichTextRendererProps {
  data: {
    time?: number;
    blocks: Array<{
      type: string;
      data: {
        text?: string;
        level?: number;
        style?: string;
        items?: string[];
      };
    }>;
    version?: string;
  };
}

const RichTextRenderer: React.FC<RichTextRendererProps> = ({ data }) => {
  const editorCore = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (editorCore.current && data) {
      // Initialize Editor.js
      const editor = new EditorJS({
        holder: editorCore.current, // The DOM element where Editor.js will be rendered
        data: data, // Pass the rich text data (in JSON format)
        tools: {
          header: {
            class: require('@editorjs/header'),
            inlineToolbar: ['link'],
          },
          list: {
            class: require('@editorjs/list'),
            inlineToolbar: ['link'],
          },
          quote: {
            class: require('@editorjs/quote'),
            inlineToolbar: ['link'],
          },
          // Add more tools as needed
        },
      });

      // Cleanup the editor when the component is unmounted
      return () => {
        editor.destroy();
      };
    }
  }, [data]);

  return <div ref={editorCore} />;
};

export default RichTextRenderer;
