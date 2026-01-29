import React, { useMemo, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  modules?: any;
  style?: React.CSSProperties;
}

/**
 * Wrapper component for ReactQuill to suppress findDOMNode warnings
 * This is a known issue with react-quill and React 18
 */
const QuillEditor: React.FC<QuillEditorProps> = ({
  value,
  onChange,
  placeholder,
  readOnly = false,
  modules,
  style,
}) => {
  const quillRef = useRef<ReactQuill>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Suppress console warnings about findDOMNode
  useEffect(() => {
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('findDOMNode is deprecated')
      ) {
        // Suppress the warning
        return;
      }
      originalWarn.apply(console, args);
    };

    return () => {
      console.warn = originalWarn;
    };
  }, []);

  const defaultModules = useMemo(
    () => ({
      toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        ['link'],
        [{ 'color': [] }, { 'background': [] }],
        ['clean']
      ],
    }),
    []
  );

  return (
    <div ref={containerRef} className="quill-editor-wrapper">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules || defaultModules}
        readOnly={readOnly}
        style={style}
      />
    </div>
  );
};

export default QuillEditor;

