import { fail, redirect, type Actions, type ServerLoad } from "@sveltejs/kit";
import { db } from "$lib/server/db/index";
import { sessionTable, userTable } from "$lib/server/db/schema"; // adjust import path as needed
import { getUserByName } from "$lib/server/db/query";
import argon2 from "argon2";

let logedIn = false;

export const load: ServerLoad = async ({locals}) => {
    // Your load function logic here
    try {
        const users = await db.select().from(userTable).execute();
        const sessions = await db.select().from(sessionTable).execute();
        return { users: users, sessions: sessions, user: locals.user, session: locals.session };
    } catch (error) {
        console.error("Error loading users:", error);
        return { users: [], user: locals.user, session: null, sessions: [] };
    }
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
            return fail(400, { error: "Username and password are required" });
        }

        try {
            const users = await getUserByName(userName);
            if (users.length === 0) {
                return fail(400, { error: "Invalid username or password" });
            }
            const user = users[0];
            const valid = await argon2.verify(user.passwordHash, password);
            if (!valid) {
                return fail(400, { error: "Invalid username or password" });
            }

            // Set cookies or session here as needed
            logedIn = true;
            return { success: true, user: user };
        } catch (error) {
            console.error("Error logging in user:", error);
            return fail(400, { error: "Invalid username or password" });
        }

       // if (logedIn) {
            //throw redirect(302, "/register");
        //}
    }
};