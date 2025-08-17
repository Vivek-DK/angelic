import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import './MarkdownRenderer.css';

const MarkdownRenderer = ({ content }) => {
  return (
    <ReactMarkdown
      children={content}
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        h1: ({ node, ...props }) => <h1 className="md-heading heading-1" {...props} />,
        h2: ({ node, ...props }) => <h2 className="md-heading heading-2" {...props} />,
        h3: ({ node, ...props }) => <h3 className="md-heading heading-3" {...props} />,
        p: ({ node, ...props }) => <p className="md-paragraph" {...props} />,
        ul: ({ node, ...props }) => <ul className="md-list" {...props} />,
        ol: ({ node, ...props }) => <ol className="md-list ordered" {...props} />,
        li: ({ node, ...props }) => <li className="md-list-item" {...props} />,
        strong: ({ node, ...props }) => <strong className="md-bold" {...props} />,
        em: ({ node, ...props }) => <em className="md-italic" {...props} />,
        a: ({ node, ...props }) => <a className="md-link" target="_blank" rel="noopener noreferrer" {...props} />,
        code: ({ node, inline, className, children, ...props }) =>
          inline ? (
            <code className="md-inline-code" {...props}>{children}</code>
          ) : (
            <pre className="md-code-block"><code {...props}>{children}</code></pre>
          ),
        blockquote: ({ node, ...props }) => <blockquote className="md-blockquote" {...props} />,
        hr: () => <hr className="md-hr" />,
        br: () => <br />,
      }}
    />
  );
};

export default MarkdownRenderer;
