/**
 * The mark at the top of every drop zone.
 *
 * Eighteen tools each wrote their own drop zone, and every one of them was a
 * dashed box with two lines of text in it, which reads as an empty placeholder
 * rather than as the place to start. One shared mark gives them all the same
 * entrance, without folding eighteen different zones into one component.
 *
 * Decorative only: the heading under it says what to drop.
 */
export default function DropIcon() {
  return (
    <span
      aria-hidden="true"
      className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl border border-line bg-ground text-accent shadow-sm"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 15V4" />
        <path d="m7.5 8.5 4.5-4.5 4.5 4.5" />
        <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
      </svg>
    </span>
  );
}
