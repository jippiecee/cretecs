import "../quote.css";

export default function LoveQuote() {
  return (
    <figure className="love-quote">
      <blockquote>
        <span>All things deserve to be loved,</span>{" "}
        <span className="dim">
          and whatever was truly loved once deserves to be loved again.
        </span>
      </blockquote>
      <figcaption>— All of us</figcaption>
    </figure>
  );
}