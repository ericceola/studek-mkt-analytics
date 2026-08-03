import 'dotenv/config';
import mysql from 'mysql2/promise';

const connection=await mysql.createConnection(process.env.DATABASE_URL);
try{
  const [columns]=await connection.query("SHOW COLUMNS FROM instagram_posts LIKE 'content_surface'");
  if(!columns.length) await connection.query("ALTER TABLE instagram_posts ADD COLUMN content_surface ENUM('Feed','Reel','Story') NOT NULL DEFAULT 'Feed' AFTER post_type");
  await connection.query("ALTER TABLE apify_runs MODIFY collection_type ENUM('profile_details','posts','stories','comments','full') NOT NULL");
  await connection.query(`UPDATE instagram_posts SET content_surface=CASE
    WHEN JSON_UNQUOTE(JSON_EXTRACT(raw_data,'$.inputUrl')) LIKE '%/stories/%' THEN 'Story'
    WHEN post_type='Reel' THEN 'Reel'
    ELSE 'Feed' END`);
  console.log('Schema de formatos atualizado.');
}finally{await connection.end();}
