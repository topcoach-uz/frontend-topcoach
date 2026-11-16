import React from "react";
import {
  multiSlotCounts,
  selectListeningGroup,
  listeningOptionLetters,
} from "./listening-library.js";

// Imported strings are text nodes, never executable HTML. Existing workspace
// classes provide all presentation, including tables, choices and answer fields.
function Rich({ node, answer }) {
  if (node == null) return null;
  if (typeof node !== "object") return String(node);
  if (Array.isArray(node))
    return (
      <>
        {node.map((item, i) => (
          <Rich key={i} node={item} answer={answer} />
        ))}
      </>
    );
  if (node.type === "input" || node.type === "inputs")
    return answer(
      Number(node.content),
      node.type === "inputs" ? node.index : undefined,
    );
  if (node.type === "input-example")
    return <strong>{String(node.content)}</strong>;
  if (node.type === "atom")
    return (
      <>
        {node.blocks?.map((block, i) => (
          <Rich key={i} node={block} answer={answer} />
        ))}
      </>
    );
  if (node.type === "input-table")
    return <Table rows={node.items} answer={answer} />;
  if (node.content != null) return String(node.content);
  return (
    <>
      {node.title && (
        <h3>
          <Rich node={node.title} answer={answer} />
        </h3>
      )}
      {node.prefix && <Rich node={node.prefix} answer={answer} />}
      {node.items && (
        <ul>
          {(Array.isArray(node.items) ? node.items : [node.items]).map(
            (item, i) => (
              <li key={i}>
                <Rich node={item} answer={answer} />
              </li>
            ),
          )}
        </ul>
      )}
    </>
  );
}
// A cell holding several atoms is a list of separate lines (bullet points in the
// source); render each on its own line so phrases do not run together.
function CellContent({ cell, answer }) {
  if (!Array.isArray(cell) || cell.length < 2)
    return <Rich node={cell} answer={answer} />;
  return (
    <>
      {cell.map((line, i) => (
        <div key={i} className="cell-line">
          <Rich node={line} answer={answer} />
        </div>
      ))}
    </>
  );
}
function Table({ rows, answer, header = true }) {
  return (
    <table className="exam-table">
      <tbody>
        {rows?.map((row, i) => (
          <tr key={i}>
            {(Array.isArray(row) ? row : [row]).map((cell, j) => {
              const Cell = header && i === 0 ? "th" : "td";
              return (
                <Cell
                  key={j}
                  rowSpan={cell?.rowspan || undefined}
                  colSpan={cell?.colspan || undefined}
                >
                  <CellContent cell={cell} answer={answer} />
                </Cell>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Group({ group, answers, update, setAnswers, input, revealed, keys }) {
  const body = group.body;
  const choices = (body.items || []).filter((item) => item?.type !== "example");
  const groupEnd =
    group.type === "option-abc" ? group.start + choices.length - 1 : group.end;
  const slots = multiSlotCounts(body);
  const letters = listeningOptionLetters(group);
  const select = (n) => (
    <span className="answer-inline">
      <span>{n}</span>
      <select
        id={`answer-${n}`}
        className="match-select"
        aria-label={`Answer ${n}`}
        value={answers[n] || ""}
        onChange={(e) => update(n, e.target.value)}
      >
        <option value="">{n}</option>
        {letters.map((letter) => (
          <option key={letter} value={letter}>
            {letter}
          </option>
        ))}
      </select>
      {revealed && <small>{keys[n - 1] || "No answer on file"}</small>}
    </span>
  );
  const answer = (n, slot) => {
    if (slot !== undefined) {
      const values = (answers[n] || "").split(" & ");
      return (
        <span className="answer-inline">
          <span>{n}</span>
          <input
            id={slot === 0 ? `answer-${n}` : `answer-${n}-${slot}`}
            aria-label={`Answer ${n}, field ${slot + 1}`}
            value={values[slot] || ""}
            onChange={(e) => {
              const next = Array.from(
                { length: slots[n] },
                (_, i) => values[i] || "",
              );
              next[slot] = e.target.value;
              update(n, next.join(" & "));
            }}
          />
          {revealed && <small>{keys[n - 1] || "No answer on file"}</small>}
        </span>
      );
    }
    return group.type.startsWith("select-") ? select(n) : input(n);
  };
  return (
    <>
      <b>
        Questions {group.start}
        {groupEnd !== group.start ? `–${groupEnd}` : ""}
      </b>
      {(group.desc.textReadable || group.desc.text || []).map((text, i) => (
        <p key={i}>{text}</p>
      ))}
      {group.desc.constraint && (
        <p>
          Write <b>{group.desc.constraint}</b> for each answer.
        </p>
      )}
      {body.title && (
        <h2>
          <Rich node={body.title} answer={answer} />
        </h2>
      )}
      {body.headline && (
        <p>
          <Rich node={body.headline} answer={answer} />
        </p>
      )}
      {body.subtitle && (
        <p>
          <Rich node={body.subtitle} answer={answer} />
        </p>
      )}
      {body.instruction && (
        <p>
          <Rich node={body.instruction} answer={answer} />
        </p>
      )}
      {group.image && (
        <img
          src={group.image}
          style={{ maxWidth: "100%", height: "auto" }}
          alt={`Diagram for questions ${group.start}–${group.end}`}
        />
      )}
      {group.imageMissing && (
        <p className="hint" role="status">
          Diagram is not available.
        </p>
      )}
      {group.type === "option-true-false" || group.type === "option-yes-no" ? (
        <>
          <p>
            {group.type === "option-true-false"
              ? "Do the following statements agree with the information in the passage?"
              : "Do the following statements agree with the views of the writer?"}
          </p>
          {choices.map((item, i) => {
            const n = group.start + i;
            const options =
              group.type === "option-true-false"
                ? ["TRUE", "FALSE", "NOT GIVEN"]
                : ["YES", "NO", "NOT GIVEN"];
            return (
              <fieldset key={n} id={`answer-${n}`} tabIndex={-1}>
                <legend>
                  <b>{n}</b> <Rich node={item} answer={answer} />
                </legend>
                {options.map((option) => (
                  <label key={option}>
                    <input
                      type="radio"
                      name={`answer-${n}`}
                      aria-label={`Answer ${n}: ${option}`}
                      checked={answers[n] === option}
                      onChange={() => update(n, option)}
                    />
                    {option}
                  </label>
                ))}
                {revealed && (
                  <small>{keys[n - 1] || "No answer on file"}</small>
                )}
              </fieldset>
            );
          })}
        </>
      ) : group.type === "option-abc" ? (
        <>
          <p>Choose the correct letter.</p>
          {body.items
            .filter((item) => item?.type === "example")
            .map((item, i) => (
              <Rich key={`example-${i}`} node={item} answer={answer} />
            ))}
          {choices.map((item, i) => {
            const n = group.start + i;
            return (
              <fieldset key={n} id={`answer-${n}`} tabIndex={-1}>
                <legend>
                  <b>{n}</b> <Rich node={item.title} answer={answer} />
                </legend>
                {item.options.map((option, index) => {
                  const letter = String.fromCharCode(65 + index);
                  return (
                    <label key={letter}>
                      <input
                        type="radio"
                        name={`answer-${n}`}
                        aria-label={`Answer ${n}: ${letter}`}
                        checked={answers[n] === letter}
                        onChange={() => update(n, letter)}
                      />
                      {letter}. <Rich node={option} answer={answer} />
                    </label>
                  );
                })}
                {revealed && (
                  <small>{keys[n - 1] || "No answer on file"}</small>
                )}
              </fieldset>
            );
          })}
        </>
      ) : group.type === "checkbox" ? (
        <fieldset>
          <legend>Choose {group.end - group.start + 1} answers.</legend>
          {Array.from({ length: group.end - group.start + 1 }, (_, i) => (
            <span key={i} id={`answer-${group.start + i}`} tabIndex={-1} />
          ))}
          {body.options.map((option, i) => {
            const letter = String.fromCharCode(65 + i);
            const values = Array.from(
              { length: group.end - group.start + 1 },
              (_, offset) => answers[group.start + offset],
            );
            return (
              <label key={letter}>
                <input
                  type="checkbox"
                  checked={values.includes(letter)}
                  onChange={() => {
                    const selected = selectListeningGroup(
                      group,
                      answers,
                      letter,
                    );
                    if (selected)
                      setAnswers((previous) => ({ ...previous, ...selected }));
                  }}
                />
                {letter}. <Rich node={option} answer={answer} />
              </label>
            );
          })}
          {revealed && (
            <small>
              {Array.from(
                { length: group.end - group.start + 1 },
                (_, i) => keys[group.start + i - 1] || "No answer on file",
              ).join(", ")}
            </small>
          )}
        </fieldset>
      ) : (
        <>
          {body.listTitle && (
            <h3>
              <Rich node={body.listTitle} answer={answer} />
            </h3>
          )}
          {body.list && (
            <ol type={letters[0] === "i" ? "i" : "A"}>
              {body.list.map((item, i) => (
                <li key={i}>
                  <Rich node={item} answer={answer} />
                </li>
              ))}
            </ol>
          )}
          {group.type === "input-table" || group.type === "input-form" ? (
            <Table
              rows={body.items}
              answer={answer}
              header={group.type === "input-table"}
            />
          ) : (
            <Rich node={{ items: body.items }} answer={answer} />
          )}
        </>
      )}
    </>
  );
}

export function ImportedListeningQuestions({ part, ...props }) {
  return (
    <>
      {part.groups.map((group) => (
        <Group key={`${group.start}-${group.end}`} group={group} {...props} />
      ))}
    </>
  );
}
