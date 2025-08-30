import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Schema imports
import {
  createUserInputSchema,
  updateUserInputSchema,
  deleteUserInputSchema,
  getUserByIdInputSchema,
  createPostInputSchema,
  updatePostInputSchema,
  deletePostInputSchema,
  getPostByIdInputSchema,
  getPostsByAuthorInputSchema,
  createCommentInputSchema,
  updateCommentInputSchema,
  deleteCommentInputSchema,
  getCommentsByPostInputSchema,
  createLikeInputSchema,
  removeLikeInputSchema
} from './schema';

// Handler imports
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { getUserById } from './handlers/get_user_by_id';
import { updateUser } from './handlers/update_user';
import { deleteUser } from './handlers/delete_user';
import { createPost } from './handlers/create_post';
import { getPosts } from './handlers/get_posts';
import { getPostById } from './handlers/get_post_by_id';
import { getPostsByAuthor } from './handlers/get_posts_by_author';
import { updatePost } from './handlers/update_post';
import { deletePost } from './handlers/delete_post';
import { createComment } from './handlers/create_comment';
import { getCommentsByPost } from './handlers/get_comments_by_post';
import { updateComment } from './handlers/update_comment';
import { deleteComment } from './handlers/delete_comment';
import { createLike } from './handlers/create_like';
import { removeLike } from './handlers/remove_like';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  getUsers: publicProcedure
    .query(() => getUsers()),

  getUserById: publicProcedure
    .input(getUserByIdInputSchema)
    .query(({ input }) => getUserById(input)),

  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),

  deleteUser: publicProcedure
    .input(deleteUserInputSchema)
    .mutation(({ input }) => deleteUser(input)),

  // Post management routes
  createPost: publicProcedure
    .input(createPostInputSchema)
    .mutation(({ input }) => createPost(input)),

  getPosts: publicProcedure
    .query(() => getPosts()),

  getPostById: publicProcedure
    .input(getPostByIdInputSchema)
    .query(({ input }) => getPostById(input)),

  getPostsByAuthor: publicProcedure
    .input(getPostsByAuthorInputSchema)
    .query(({ input }) => getPostsByAuthor(input)),

  updatePost: publicProcedure
    .input(updatePostInputSchema)
    .mutation(({ input }) => updatePost(input)),

  deletePost: publicProcedure
    .input(deletePostInputSchema)
    .mutation(({ input }) => deletePost(input)),

  // Comment management routes
  createComment: publicProcedure
    .input(createCommentInputSchema)
    .mutation(({ input }) => createComment(input)),

  getCommentsByPost: publicProcedure
    .input(getCommentsByPostInputSchema)
    .query(({ input }) => getCommentsByPost(input)),

  updateComment: publicProcedure
    .input(updateCommentInputSchema)
    .mutation(({ input }) => updateComment(input)),

  deleteComment: publicProcedure
    .input(deleteCommentInputSchema)
    .mutation(({ input }) => deleteComment(input)),

  // Like management routes
  createLike: publicProcedure
    .input(createLikeInputSchema)
    .mutation(({ input }) => createLike(input)),

  removeLike: publicProcedure
    .input(removeLikeInputSchema)
    .mutation(({ input }) => removeLike(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();