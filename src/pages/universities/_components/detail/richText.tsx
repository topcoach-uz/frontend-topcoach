import React, { useMemo } from 'react';
import styles from './detail.module.scss';

type Block = {
  id: string;
  type: string;
  data: {
    html?: string;
    text?: string;
    level?: number;
    style?: string;
    url?: string;
    caption?: string;
    alignment?: string;
    layout?: 'full' | 'split-left' | 'split-right' | 'left' | 'right'; // Image layout options
    imageUrl?: string; // For image blocks and split layout
    imageCaption?: string; // For image blocks
    videoId?: string; // For YouTube embeds
    file?: any; // For uploaded files
    items?: string[]; // For list blocks
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
                  {renderTextContent(data.text || '')}{' '}
                  {isUniversityDetail && (
                    <div className={styles.ranking}>
                      {ranking
                        ? `#${ranking} in QS Ranking`
                        : 'No ranking available'}
                    </div>
                  )}
                </>
              ) : (
                renderTextContent(data.text || '')
              )}
            </Tag>
          );
        }

        case 'paragraph':
          return (
            <p key={id} className={styles.details}>
              {renderTextContent(data.text || '')}
            </p>
          );

        case 'quote':
          return (
            <blockquote key={id} className={styles.quote}>
              {renderTextContent(data.text || '')}
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

        case 'image':
        case 'simpleImage': {
          const layout = data.layout || 'full';
          const imageUrl = data.url || data.imageUrl;
          const caption = data.caption || data.imageCaption;

          if (!imageUrl) return null;

          // Full width image
          if (layout === 'full') {
            return (
              <figure key={id} style={{ margin: '24px 0', width: '100%' }}>
                <img
                  src={imageUrl}
                  alt={caption || 'Image'}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    borderRadius: '8px',
                  }}
                />
                {caption && (
                  <figcaption
                    style={{
                      marginTop: '8px',
                      fontSize: '14px',
                      color: '#666',
                      textAlign: 'center',
                    }}
                  >
                    {caption}
                  </figcaption>
                )}
              </figure>
            );
          }

          // Split layout (text + image) - legacy support
          if (layout === 'split-left' || layout === 'split-right') {
            return (
              <div
                key={id}
                style={{
                  display: 'flex',
                  flexDirection: layout === 'split-left' ? 'row' : 'row-reverse',
                  gap: '32px',
                  margin: '32px 0',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: '1', minWidth: 0 }}>
                  <img
                    src={imageUrl}
                    alt={caption || 'Image'}
                    style={{
                      width: '100%',
                      height: 'auto',
                      borderRadius: '8px',
                      display: 'block',
                    }}
                  />
                  {caption && (
                    <p
                      style={{
                        marginTop: '8px',
                        fontSize: '14px',
                        color: '#666',
                        fontStyle: 'italic',
                      }}
                    >
                      {caption}
                    </p>
                  )}
                </div>
                <div style={{ flex: '1', minWidth: 0 }}>
                  {/* Text content would be in the next block */}
                </div>
              </div>
            );
          }

          return null;
        }

        case 'youtube': {
          // Handle YouTube embeds from custom tool
          const videoId = data.videoId || '';
          const caption = data.caption || '';

          if (videoId) {
            return (
              <div key={id} style={{ margin: '24px 0' }}>
                <div
                  style={{
                    position: 'relative',
                    paddingBottom: '56.25%', // 16:9 aspect ratio
                    height: 0,
                    overflow: 'hidden',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                >
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 0,
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                {caption && (
                  <p
                    style={{
                      marginTop: '12px',
                      fontSize: '14px',
                      color: '#666',
                      textAlign: 'center',
                    }}
                  >
                    {caption}
                  </p>
                )}
              </div>
            );
          }
          return null;
        }

        case 'embed': {
          // Handle generic embeds (fallback for other video platforms)
          const embedUrl = data.url || '';
          if (embedUrl.includes('youtube.com') || embedUrl.includes('youtu.be')) {
            // Extract video ID
            const videoIdMatch = embedUrl.match(
              /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
            );
            const videoId = videoIdMatch ? videoIdMatch[1] : null;

            if (videoId) {
              return (
                <div
                  key={id}
                  style={{
                    margin: '24px 0',
                    position: 'relative',
                    paddingBottom: '56.25%', // 16:9 aspect ratio
                    height: 0,
                    overflow: 'hidden',
                    borderRadius: '8px',
                  }}
                >
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 0,
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              );
            }
          }
          return null;
        }

        case 'splitLayout': {
          // Handle split layout blocks (text + image side by side)
          const imageUrl = data.imageUrl || '';
          const text = data.text || '';
          const layout = data.layout || 'left';
          const caption = data.caption || '';
          const isLeft = layout === 'left';

          return (
            <div
              key={id}
              style={{
                margin: '32px 0',
                display: 'flex',
                flexDirection: isLeft ? 'row' : 'row-reverse',
                gap: '32px',
                alignItems: 'flex-start',
              }}
            >
              {/* Image side */}
              <div style={{ flex: '1', minWidth: 0 }}>
                {imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt={caption || 'Image'}
                      style={{
                        width: '100%',
                        height: 'auto',
                        borderRadius: '8px',
                        display: 'block',
                      }}
                    />
                    {caption && (
                      <p
                        style={{
                          marginTop: '8px',
                          fontSize: '14px',
                          color: '#666',
                          fontStyle: 'italic',
                        }}
                      >
                        {caption}
                      </p>
                    )}
                  </>
                ) : (
                  <div
                    style={{
                      padding: '60px 20px',
                      background: '#f5f5f5',
                      borderRadius: '8px',
                      textAlign: 'center',
                      color: '#999',
                    }}
                  >
                    No image
                  </div>
                )}
              </div>

              {/* Text side */}
              <div style={{ flex: '1', minWidth: 0 }}>
                {text ? (
                  <div
                    style={{
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.6',
                      color: '#333',
                    }}
                  >
                    {text}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '60px 20px',
                      background: '#f5f5f5',
                      borderRadius: '8px',
                      textAlign: 'center',
                      color: '#999',
                    }}
                  >
                    No text content
                  </div>
                )}
              </div>
            </div>
          );
        }

        case 'list': {
          // Handle list blocks
          const items = data.items || [];
          const style = data.style || 'unordered';

          if (style === 'ordered') {
            return (
              <ol
                key={id}
                style={{
                  margin: '16px 0',
                  paddingLeft: '24px',
                  lineHeight: '1.6',
                }}
              >
                {items.map((item: string, index: number) => (
                  <li key={index} style={{ marginBottom: '8px' }}>
                    {renderTextContent(item)}
                  </li>
                ))}
              </ol>
            );
          } else {
            return (
              <ul
                key={id}
                style={{
                  margin: '16px 0',
                  paddingLeft: '24px',
                  lineHeight: '1.6',
                }}
              >
                {items.map((item: string, index: number) => (
                  <li key={index} style={{ marginBottom: '8px' }}>
                    {renderTextContent(item)}
                  </li>
                ))}
              </ul>
            );
          }
        }

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
