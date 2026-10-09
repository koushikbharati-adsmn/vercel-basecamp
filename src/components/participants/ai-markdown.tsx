import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export function AiMarkdown({ children }: { children: string }) {
  return (
    <div className="[&>:first-child]:mt-0 [&>:last-child]:mb-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="my-2">{children}</p>,
          h1: ({ children }) => (
            <h1 className="mt-4 mb-2 text-lg leading-[1.3] font-bold">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-4 mb-2 text-base leading-[1.3] font-bold">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-4 mb-2 leading-[1.3] font-bold">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-4 mb-2 leading-[1.3] font-bold">{children}</h4>
          ),
          h5: ({ children }) => (
            <h5 className="mt-4 mb-2 leading-[1.3] font-bold">{children}</h5>
          ),
          h6: ({ children }) => (
            <h6 className="mt-4 mb-2 leading-[1.3] font-bold">{children}</h6>
          ),
          ul: ({ children }) => (
            <ul className="my-3 list-disc pl-5">{children}</ul>
          ),
          ol: ({ children, start }) => (
            <ol start={start} className="my-3 list-decimal pl-5">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="my-1">{children}</li>,
          a: ({ children, href }) => (
            <a
              href={href}
              className="font-bold underline underline-offset-2"
              target={
                /^(https?:)?\/\//i.test(href ?? "") ? "_blank" : undefined
              }
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-[color-mix(in_srgb,var(--border-color)_30%,transparent)] pl-3 italic">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => (
            <code
              className={`bg-[color-mix(in_srgb,var(--surface-tint)_6%,transparent)] px-1 py-0.5 text-[0.875em] ${className ?? ""}`}
            >
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="my-3 max-w-full overflow-x-auto bg-[color-mix(in_srgb,var(--surface-tint)_6%,transparent)] p-3 whitespace-pre [&_code]:bg-transparent [&_code]:p-0">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="my-3 w-full border-collapse text-left text-xs">
                {children}
              </table>
            </div>
          ),
          td: ({ children, style }) => (
            <td
              style={style}
              className="border border-[color-mix(in_srgb,var(--border-color)_20%,transparent)] px-2 py-1.5"
            >
              {children}
            </td>
          ),
          th: ({ children, style }) => (
            <th
              style={style}
              className="border border-[color-mix(in_srgb,var(--border-color)_20%,transparent)] bg-[color-mix(in_srgb,var(--surface-tint)_5%,transparent)] px-2 py-1.5 font-bold"
            >
              {children}
            </th>
          ),
          hr: () => (
            <hr className="my-4 border-[color-mix(in_srgb,var(--border-color)_20%,transparent)]" />
          ),
          img: ({ src, alt, title }) => (
            <img
              src={src}
              alt={alt}
              title={title}
              className="my-3 h-auto max-w-full"
            />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
