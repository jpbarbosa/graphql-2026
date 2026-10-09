CREATE TYPE "public"."credit_role" AS ENUM('ACTOR', 'DIRECTOR', 'WRITER');--> statement-breakpoint
CREATE TABLE "credits" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "credits_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"movie_id" integer NOT NULL,
	"person_id" integer NOT NULL,
	"role" "credit_role" NOT NULL,
	"character" text
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "genres_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	CONSTRAINT "genres_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "movie_genres" (
	"movie_id" integer NOT NULL,
	"genre_id" integer NOT NULL,
	CONSTRAINT "movie_genres_movie_id_genre_id_pk" PRIMARY KEY("movie_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "movies" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "movies_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"released" integer NOT NULL,
	"runtime" integer,
	"rating" real,
	"tagline" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "movies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "people_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"born" integer
);
--> statement-breakpoint
ALTER TABLE "credits" ADD CONSTRAINT "credits_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credits" ADD CONSTRAINT "credits_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_genres" ADD CONSTRAINT "movie_genres_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_genres" ADD CONSTRAINT "movie_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "credits_movie_id_index" ON "credits" USING btree ("movie_id");--> statement-breakpoint
CREATE INDEX "credits_person_id_index" ON "credits" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "movie_genres_genre_id_index" ON "movie_genres" USING btree ("genre_id");