import type { Actions, ServerLoad } from "@sveltejs/kit";
import { db } from "$lib/server/db/index";
import { userTable } from "$lib/server/db/schema"; // adjust import path as needed

export const load: ServerLoad = async () => {
    // Your load function logic here
};

export const actions: Actions = {
    // Your action function logic here
    login: async ({ request }) => {
        const formData = await request.formData();
        // Handle login action
        const userName = formData.get("username") as string;
        const password = formData.get("password") as string;
        // Perform login logic, e.g., validate credentials, set cookies, etc.
        if (!userName || !password) {
            throw new Error("Username and password are required");
        }
        const user = await db.insert(userTable).values({
            name: userName,
            password: password,
            email: `${userName}@example.com`,
            role: "student",
        });
    }
};