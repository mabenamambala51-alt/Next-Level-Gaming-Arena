(() => {
    const pages = [
        ["home", "⌂", "Home", "index.html"],
        ["games", "🎮", "Games", "pages/games.html"],
        ["sports", "⚽", "Sports", "pages/sports.html"],
        ["tournaments", "🏆", "Tournaments", "pages/tournaments.html"],
        ["events", "📣", "Events", "pages/events.html"],
        ["book", "📅", "Book", "pages/book.html"],
        ["leaderboard", "📊", "Scores", "pages/leaderboard.html"],
        ["membership", "⭐", "Members", "pages/membership.html"],
        ["parties", "🎉", "Parties", "pages/parties.html"],
        ["community", "💬", "Community", "pages/community.html"],
        ["about", "ℹ️", "About", "pages/about.html"],
        ["success", "✅", "Status", "pages/success.html"]
    ];
    const pageId = document.body.dataset.page || "home";
    const root = document.body.dataset.root || "";
    const nav = document.getElementById("bottom-nav");
    if (nav) nav.innerHTML = pages.map(([id, icon, label, path]) => `<a href="${root}${path}"${id === pageId ? ' aria-current="page"' : ""}><span aria-hidden="true">${icon}</span>${label}</a>`).join("");

    const money = amount => `R${Number(amount).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
    const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Local storage is optional. */ } };
    const rootLink = page => `${root}${page === "home" ? "index.html" : `pages/${page}.html`}`;

    document.querySelectorAll("[data-book-experience]").forEach(button => button.addEventListener("click", () => {
        const target = rootLink("book");
        location.href = `${target}?experience=${encodeURIComponent(button.dataset.bookExperience)}`;
    }));

    const experience = document.getElementById("experience");
    const qty = document.getElementById("qty");
    const updateQuote = () => {
        if (!experience || !qty) return;
        const count = Math.max(1, Math.min(20, Number(qty.value) || 1));
        qty.value = count;
        const price = Number(experience.selectedOptions[0]?.dataset.price || 0);
        const rate = count >= 4 ? .15 : count === 3 ? .1 : count === 2 ? .05 : 0;
        const total = price * count * (1 - rate);
        const totalOutput = document.getElementById("total");
        const discountOutput = document.getElementById("discount");
        if (totalOutput) totalOutput.textContent = money(total);
        if (discountOutput) discountOutput.textContent = rate ? `${Math.round(rate * 100)}% discount · You save ${money(price * count - total)}` : "No discount applied";
    };
    if (experience && new URLSearchParams(location.search).has("experience")) experience.value = new URLSearchParams(location.search).get("experience");
    experience?.addEventListener("change", updateQuote);
    qty?.addEventListener("input", updateQuote);
    updateQuote();

    const dateInput = document.getElementById("date");
    if (dateInput) {
        const today = new Date();
        today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
        dateInput.min = today.toISOString().slice(0, 10);
    }
    document.getElementById("booking-form")?.addEventListener("submit", event => {
        event.preventDefault();
        const form = event.currentTarget;
        if (!form.reportValidity()) return;
        if (dateInput && dateInput.value < dateInput.min) { dateInput.setCustomValidity("Choose a date from today onward."); dateInput.reportValidity(); dateInput.setCustomValidity(""); return; }
        const data = new FormData(form);
        const booking = Object.fromEntries(data.entries());
        booking.experienceName = experience.selectedOptions[0].text;
        booking.quotation = document.getElementById("total")?.textContent || "";
        write("nextLevelLastBooking", booking);
        location.href = rootLink("success");
    });

    const gameSearch = document.getElementById("game-search");
    let gameFilter = "all";
    const filterGames = () => {
        const query = (gameSearch?.value || "").trim().toLowerCase();
        let visible = 0;
        document.querySelectorAll("[data-game-category]").forEach(card => {
            const matchCategory = gameFilter === "all" || card.dataset.gameCategory === gameFilter;
            const matchQuery = `${card.dataset.search || ""} ${card.innerText}`.toLowerCase().includes(query);
            card.hidden = !(matchCategory && matchQuery);
            if (!card.hidden) visible++;
        });
        const empty = document.getElementById("game-empty");
        if (empty) empty.hidden = visible > 0;
    };
    gameSearch?.addEventListener("input", filterGames);
    document.querySelectorAll("[data-filter]").forEach(button => button.addEventListener("click", () => {
        gameFilter = button.dataset.filter;
        document.querySelectorAll("[data-filter]").forEach(chip => chip.classList.toggle("active", chip === button));
        filterGames();
    }));

    document.querySelectorAll("[data-signup]").forEach(button => {
        const key = button.dataset.signup;
        const signups = read("nextLevelSignups", []);
        if (signups.includes(key)) { button.textContent = "Joined ✓ · Undo"; button.setAttribute("aria-pressed", "true"); }
        button.addEventListener("click", () => {
            const current = read("nextLevelSignups", []);
            const joined = !current.includes(key);
            write("nextLevelSignups", joined ? [...current, key] : current.filter(item => item !== key));
            button.textContent = joined ? "Joined ✓ · Undo" : button.dataset.label;
            button.setAttribute("aria-pressed", String(joined));
            const message = document.getElementById("signup-status");
            if (message) message.textContent = joined ? "You're on the local interest list. Saved on this device." : "You left the local interest list.";
        });
    });

    const rankings = {
        gaming: [["PixelPilot", "Joystick Crew", "1,840"], ["NovaRush", "Night Owls", "1,720"], ["MakoGG", "Joystick Crew", "1,610"], ["ArcadeAce", "Solo Queue", "1,480"], ["GG_Kay", "Night Owls", "1,390"]],
        sports: [["MakoGG", "Court Kings", "2,040"], ["GG_Kay", "Five Alive", "1,880"], ["NovaRush", "Court Kings", "1,760"], ["PixelPilot", "Five Alive", "1,620"], ["ArcadeAce", "Free Agents", "1,510"]]
    };
    const renderRankings = category => {
        const rows = document.getElementById("leader-rows");
        if (!rows) return;
        rows.innerHTML = rankings[category].map((row, index) => `<tr><td>${index + 1}</td><td>${row[0]}</td><td>${row[1]}</td><td><strong>${row[2]}</strong></td></tr>`).join("");
        document.getElementById("leader-top").textContent = rankings[category][0][2];
        document.getElementById("leader-count").textContent = category === "gaming" ? "248" : "96";
    };
    document.querySelectorAll("[data-ranking]").forEach(button => button.addEventListener("click", () => {
        document.querySelectorAll("[data-ranking]").forEach(item => item.classList.toggle("active", item === button));
        renderRankings(button.dataset.ranking);
    }));
    renderRankings("gaming");

    document.querySelectorAll("[data-plan]").forEach(button => {
        const plan = button.dataset.plan;
        if (read("nextLevelMembership", "") === plan) button.closest(".plan-card")?.classList.add("selected");
        button.addEventListener("click", () => {
            write("nextLevelMembership", plan);
            document.querySelectorAll(".plan-card").forEach(card => card.classList.toggle("selected", card.dataset.plan === plan));
            const message = document.getElementById("plan-status");
            if (message) message.textContent = `${plan[0].toUpperCase()}${plan.slice(1)} selected and saved on this device. Demo only; no payment is processed.`;
        });
    });
    const savedPlan = read("nextLevelMembership", "");
    const planStatus = document.getElementById("plan-status");
    if (savedPlan && planStatus) planStatus.textContent = `${savedPlan[0].toUpperCase()}${savedPlan.slice(1)} selected and saved on this device. Demo only; no payment is processed.`;

    const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
    const feed = document.getElementById("community-feed");
    const renderFeed = () => {
        if (!feed) return;
        const posts = read("nextLevelCommunityPosts", []);
        feed.innerHTML = posts.length ? posts.map(post => `<div class="feed-item"><strong>${escapeHtml(post.name)}</strong><div>${escapeHtml(post.message)}</div><small>${escapeHtml(post.time)}</small></div>`).join("") : '<p class="muted">No posts yet. Start the conversation.</p>';
    };
    document.getElementById("community-form")?.addEventListener("submit", event => {
        event.preventDefault();
        const form = event.currentTarget;
        if (!form.reportValidity()) return;
        const data = new FormData(form);
        const posts = read("nextLevelCommunityPosts", []);
        posts.unshift({ name: data.get("name"), message: data.get("message"), time: new Date().toLocaleString() });
        write("nextLevelCommunityPosts", posts.slice(0, 20));
        form.reset();
        renderFeed();
    });
    renderFeed();

    const lastBooking = read("nextLevelLastBooking", null);
    const bookingSummary = document.getElementById("booking-summary");
    if (bookingSummary) bookingSummary.innerHTML = lastBooking ? `<div class="feed-item"><strong>${escapeHtml(lastBooking.experienceName || lastBooking.experience || "Arena experience")}</strong><p class="muted">${escapeHtml(lastBooking.date || "")} · ${escapeHtml(lastBooking.quantity || "1")} booking(s)</p><strong>${escapeHtml(lastBooking.quotation || "")}</strong></div>` : '<p class="muted">Your booking request is saved in this browser. Start a booking to see its summary here.</p>';
})();
