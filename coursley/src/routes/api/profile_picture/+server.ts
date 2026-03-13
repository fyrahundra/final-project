import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { cloudinary } from '$lib/cloudinary';
import { validateImageFile } from '$lib/validation';
import { publishProfilePictureChanged } from '$lib/server/theme-stream';

export const POST: RequestHandler = async ({ request, locals }) => {
    const formData = await request.formData();
    const picture = formData.get('picture') as File | null;

    if (!locals.user) {
        return json({ success: false, message: 'User not authenticated' }, { status: 401 });
    }

    if (!picture || !(picture instanceof File)) {
        return json({ success: false, message: 'Invalid or no picture provided' }, { status: 400 });
    }

    try {
        validateImageFile(picture);
        
        const buffer = Buffer.from(await picture.arrayBuffer());
        
        const upload = await new Promise<{ secure_url: string; public_id: string; version: number }>(
				(resolve, reject) => {
					const stream = cloudinary.uploader.upload_stream(
						{
							folder: 'forum-app/profile',
							resource_type: 'image',
                            quality: 'auto:good',
                            fetch_format: 'auto',
                            width: 256,
                            height: 256,
                            crop: 'limit'
						},
						(error, result) => {
							if (error || !result) return reject(error);
                            resolve({
                                secure_url: result.secure_url!,
                                public_id: result.public_id!,
                                version: result.version!
                            });
						}
					);
					stream.end(buffer);
				}
			);

        const profilePicture = cloudinary.url(upload.public_id, {
            secure: true,
            version: upload.version,
            transformation: [
                {
                    width: 160,
                    height: 160,
                    crop: 'fill',
                    gravity: 'auto:face',
                    fetch_format: 'auto',
                    quality: 'auto:good'
                }
            ]
        });
        
        await db.update(userTable)
            .set({ profilePicture })
            .where(eq(userTable.id, locals.user.id))
            .execute();

        locals.user.profilePicture = profilePicture;
        await publishProfilePictureChanged({
            userId: locals.user.id,
            profilePicture
        });
    }catch (error) {
        console.error('Error updating profile picture:', error);
        return json({ success: false, message: 'Failed to update profile picture' }, { status: 500 });
    }

    return json({ success: true, message: 'Profile picture updated successfully', profilePicture: locals.user.profilePicture });
};