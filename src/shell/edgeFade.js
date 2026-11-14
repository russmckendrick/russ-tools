export function edgeFade(scroller) {
  const sync = () => {
    const room = scroller.scrollWidth - scroller.clientWidth;
    scroller.toggleAttribute('data-more-start', scroller.scrollLeft > 1);
    scroller.toggleAttribute('data-more-end', scroller.scrollLeft < room - 1);
  };
  scroller.addEventListener('scroll', sync, { passive: true });
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(sync).observe(scroller);
  sync();
  return sync;
}
