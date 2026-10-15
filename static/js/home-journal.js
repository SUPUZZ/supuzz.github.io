const journal = document.querySelector('#journal.home-journal');
if (journal) {
    const posts = [...journal.querySelectorAll('.journal-post')];
    const filter = journal.querySelector('#journal-category');
    const more = journal.querySelector('[data-post-more]');
    const count = journal.querySelector('[data-post-count]');
    let limit = 4;
    const update = () => {
        const matching = posts.filter(post => filter.value === 'all' || post.dataset.postCategory === filter.value);
        for (const post of posts) post.hidden = true;
        for (const post of matching.slice(0, limit)) post.hidden = false;
        count.textContent = `${Math.min(limit, matching.length)} of ${matching.length} posts`;
        more.hidden = limit >= matching.length;
    };
    filter.addEventListener('change', () => { limit = 4; update(); });
    more.addEventListener('click', () => {
        const previousCount = posts.filter(post => !post.hidden).length;
        limit += 4;
        update();
        const firstNew = posts.filter(post => !post.hidden)[previousCount];
        if (firstNew) firstNew.querySelector('a').focus({ preventScroll: true });
    });
    journal.querySelector('.journal-filter').hidden = false;
    journal.querySelector('.journal-more').hidden = false;
    update();
}
