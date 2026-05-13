<svelte:head>
    <title>Admin Dashboard</title>
</svelte:head>

<script lang="ts">
    const cards = [
        {
            href: '/dashboard/sessions',
            title: 'Active sessions',
            description: 'Inspect live sessions, devices, and login footprints.'
        },
        {
            href: '/dashboard/requests',
            title: 'Admin requests',
            description: 'Review and process role-change requests.'
        }
    ];
</script>

<section class="dashboard-hero">
    <div>
        <p class="eyebrow">Admin dashboard</p>
        <h2>Operate Coursley from one place.</h2>
        <p class="lede">
            Monitor sessions, review requests, and keep the platform tidy with fast access to the
            most important controls.
        </p>
    </div>
</section>

<section class="card-grid">
    {#each cards as card}
        <a class="card" href={card.href}>
            <span class="card-label">Open</span>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
        </a>
    {/each}
</section>

<style>
    .dashboard-hero {
        padding: 1rem 0 1.5rem;
    }

    .eyebrow {
        margin: 0 0 0.45rem 0;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        font-size: 0.72rem;
        font-weight: 700;
        color: var(--primary-color);
    }

    h2 {
        margin: 0;
        font-size: clamp(2rem, 4vw, 3.2rem);
        line-height: 1.05;
    }

    .lede {
        max-width: 60ch;
        margin: 1rem 0 0;
        color: rgba(15, 23, 42, 0.72);
        font-size: 1.05rem;
    }

    .card-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
    }

    .card {
        display: block;
        padding: 1.25rem;
        border-radius: 1.1rem;
        background: rgba(255, 255, 255, 0.92);
        box-shadow: 0 14px 35px rgba(15, 23, 42, 0.08);
        text-decoration: none;
        color: inherit;
        transition:
            transform 0.18s ease,
            box-shadow 0.18s ease;
    }

    .card:hover {
        transform: translateY(-2px);
        box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12);
    }

    .card-label {
        display: inline-flex;
        padding: 0.35rem 0.65rem;
        border-radius: 999px;
        background: rgba(74, 144, 226, 0.12);
        color: var(--primary-color);
        font-size: 0.8rem;
        font-weight: 700;
        margin-bottom: 0.9rem;
    }

    .card h3 {
        margin: 0 0 0.45rem 0;
        font-size: 1.2rem;
    }

    .card p {
        margin: 0;
        color: rgba(15, 23, 42, 0.7);
    }

    @media (max-width: 720px) {
        .card-grid {
            grid-template-columns: 1fr;
        }
    }
</style>