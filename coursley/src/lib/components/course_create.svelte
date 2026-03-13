<div class="course-create">
    <h1 class="title">Create Course</h1>
    <form class="course-form" method="POST" action="/api/courses">
        <input type="text" name="title" placeholder="Course Title" required />
        <textarea name="description" placeholder="Course Description" required></textarea>
        <button type="submit">Create Course</button>
    </form>
</div>

<style>
    .course-create {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
    }

    .title {
        text-align: center;
        margin-bottom: 20px;
    }

    .course-form {
        display: flex;
        flex-direction: column;
    }

    .course-form input,
    .course-form textarea {
        margin-bottom: 10px;
        padding: 10px;
        font-size: 1rem;
    }

    .course-form button {
        padding: 10px;
        font-size: 1rem;
        background-color: #0070f3;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }

    .course-form button:hover {
        background-color: #005bb5;
    }
</style>