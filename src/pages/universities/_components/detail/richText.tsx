import React, { useMemo } from 'react';
import styles from './detail.module.scss';

type Block = {
  id: string;
  type: string;
  data: {
    html?: string;
    text: string;
    level?: number;
    style?: string;
    url?: string;
    caption?: string;
    alignment?: string;
  };
};

type Props = {
  blocks: Block[];
  id?: string;
  ranking?: number;
  isUniversityDetail?: boolean;
};

// Optimized helper function to decode HTML entities
const decodeHtmlEntities = (text: string): string => {
  // Use a more efficient method than creating DOM elements
  const htmlEntities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
  };
  
  return text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
    return htmlEntities[entity] || entity;
  });
};

// Memoized helper function to render text with proper HTML entity handling
const renderTextContent = (text: string) => {
  // Decode HTML entities and handle multiple spaces
  const decodedText = decodeHtmlEntities(text);
  
  // Split by multiple spaces and rejoin with single spaces
  const cleanedText = decodedText.replace(/\s+/g, ' ').trim();
  
  return cleanedText;
};

const RichTextRenderer: React.FC<Props> = React.memo(({
  blocks,
  id,
  ranking,
  isUniversityDetail = false,
}) => {
  // Memoize the rendered blocks to prevent unnecessary re-renders
  const renderedBlocks = useMemo(() => {
    return blocks.map((block) => {
      const { id, type, data } = block;

      switch (type) {
        case 'header': {
          const level = data.level || 2;
          const Tag = `h${level}` as keyof JSX.IntrinsicElements;

          return (
            <Tag
              key={id}
              className={`font-bold ${
                level === 1
                  ? 'text-4xl'
                  : level === 2
                    ? styles.name
                    : level === 3
                      ? styles.minorTitles
                      : 'text-xl'
              }`}
            >
              {level === 2 ? (
                <>
                  {renderTextContent(data.text)}{' '}
                  {isUniversityDetail && (
                    <div className={styles.ranking}>
                      {ranking
                        ? `#${ranking} in QS Ranking`
                        : 'No ranking available'}
                    </div>
                  )}
                </>
              ) : (
                renderTextContent(data.text)
              )}
            </Tag>
          );
        }

        case 'paragraph':
          return (
            <p key={id} className={styles.details}>
              {renderTextContent(data.text)}
            </p>
          );

        case 'quote':
          return (
            <blockquote key={id} className={styles.quote}>
              {renderTextContent(data.text)}
            </blockquote>
          );
        case 'raw':
          return (
            <div
              key={id}
              style={{ display: 'contents' }}
              dangerouslySetInnerHTML={{ __html: data?.html || '' }}
            />
          );

        default:
          return null;
      }
    });
  }, [blocks, ranking, isUniversityDetail]);

  return (
    <div className="space-y-4">
      {renderedBlocks}
    </div>
  );
});

export default RichTextRenderer;
