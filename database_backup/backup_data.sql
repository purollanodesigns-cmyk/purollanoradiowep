-- Supabase Data Backup
-- Generated on 2026-11-08T23:25:12.324Z

-- Table: announcements (1 records)
INSERT INTO public.announcements (id, title, body, image_url, path, created_at, is_published, updated_at) VALUES ('e93a0423-45e1-4ac0-9780-832b76827e28', 'Puro Llano Radio', 'Con lo mejor del Llano.', NULL, '/', '2026-11-08T17:50:08.839371+00:00', true, '2026-11-08T17:50:08.839371+00:00') ON CONFLICT DO NOTHING;

-- Table: comments (3 records)
INSERT INTO public.comments (id, name, message, likes, reports, is_hidden, client_id, created_at) VALUES ('a53701e3-a60a-47cb-8813-bbf5c7ee004e', 'Carlos', 'En sintonía, escuchando joropo.', 1, 0, false, 'c_mriikblm_0wyh6vk1nb', '2026-07-13T00:58:26.091118+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.comments (id, name, message, likes, reports, is_hidden, client_id, created_at) VALUES ('d201a7c4-d97c-4ad1-869c-a6f5e9dd3fa5', 'Cruz perdomo', 'Desde galiperoviejo amazonas puerto Ayacucho saludos copleros y copleras del Yano', 1, 0, false, 'c_ms8aj349_dolt1d4mp4', '2026-07-31T01:57:41.951527+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.comments (id, name, message, likes, reports, is_hidden, client_id, created_at) VALUES ('169e0ee4-d47c-4e7d-ad47-7c300d2518b4', 'cirilo perez', 'Esto si es bueno puro llano los felicito y les doy gracias por tan buena intención enarteser nuestro folklore Dió los Bendiga y ayude  desde Gunarito Edo portuguesa el Ruiseñor de los Bancos', 1, 0, false, 'c_mufytz41_hi0qjkrzvv', '2026-09-24T20:20:02.4833+00:00') ON CONFLICT DO NOTHING;

-- Table: recommended_videos (10 records)
INSERT INTO public.recommended_videos (id, youtube_id, title, description, sort_order, is_published, created_at, updated_at) VALUES ('9b802b2c-4ab4-4cf0-9c5c-a8c26d2d4999', '3QAgXEqoI-A', 'Jorge Alba - Cámbiate El Nombre (Video Oficia)', 'Disfruta “Cámbiate el Nombre”, el nuevo video oficial de Jorge Alba, una canción llena de sentimiento y del auténtico sonido de la música llanera.', 0, true, '2026-09-05T02:07:55.611519+00:00', '2026-09-05T02:07:55.611519+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.recommended_videos (id, youtube_id, title, description, sort_order, is_published, created_at, updated_at) VALUES ('2d8e32f6-b1a3-41cc-9e8e-cb737ddc5790', 'h1XIww3er7M', 'Miguelito Díaz - Los Últimos Toros (Vídeo Oficial)', 'LOS ÚLTIMOS TOROS

Vamos caballo 
Que son los últimos toros 
Ya llegó el fin de semana 
No habrá mañana 
El llano está pa ti solo, para ti solo 
Ya de aquí te soy sabana .', 0, true, '2026-09-05T02:11:19.273146+00:00', '2026-09-05T02:11:19.273146+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.recommended_videos (id, youtube_id, title, description, sort_order, is_published, created_at, updated_at) VALUES ('96feaa41-768d-4bf4-a6f6-b587cf55701b', '7AGnpWof-d4', 'Norelkys Rondón - Conversando Con La Luna (Video Oficial)', 'Disfruta de "Conversando Con La Luna", lo nuevo de Norelkys Rondón, La Mujer de Acero. Un pasaje llanero cargado de sentimiento, sentimiento criollo y la elegancia que caracteriza a nuestra música folclórica.', 0, true, '2026-09-05T02:12:17.355939+00:00', '2026-09-05T02:12:17.355939+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.recommended_videos (id, youtube_id, title, description, sort_order, is_published, created_at, updated_at) VALUES ('09743f57-1109-4a5b-9487-8424314fd858', 'L6ZoDIyyUa8', 'Relación Prohibida - Andreina Brito', 'Tema:
Relación Prohibida.
Autor: Deivi Bordones.
 
Créditos y Personal:
 
"La Tribu Llanera"
Arpa: Joseito Hernández
Cuatro: Shalom Zapata
Maracas: Edwards Borjas
Bajo: Cesar Peñaranda
 
Arreglos Musicales:
Joseito Hernández', 0, true, '2026-09-05T02:13:13.179664+00:00', '2026-09-05T02:13:13.179664+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.recommended_videos (id, youtube_id, title, description, sort_order, is_published, created_at, updated_at) VALUES ('63893572-b4c7-403a-a757-a87a70eacecd', 'sYlfpj7hJ74', 'La Negra Linares - Trago de Coraje (Vídeo Oficial)', 'Créditos: Deivi Bordones (Autor), Julio González Jr (Arpa Llanera), Rodolfo Inojosa (Cuatro Llanero), El Niño Torres (Bajo), Iván Blanco (Maracas LLaneras), Jorge Silva (Ing Grabación, Mezcla y Master)', 0, true, '2026-09-05T02:15:54.913924+00:00', '2026-09-05T02:15:54.913924+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.recommended_videos (id, youtube_id, title, description, sort_order, is_published, created_at, updated_at) VALUES ('cdaed0a7-069a-4be9-a620-8dce58ee60d6', 'coYOzuUeyOY', 'Génesis Fuenmayor - Para Cantarte Llanura (Vídeo Oficial)', 'Créditos: Maikel Mendoza (Autor), Maikel Mendoza (Bandola Llanera), Gabriel Chauran (Cuatro Llanero), Julio González (Maracas Llaneras), Cristóbal Jaramillo (Bajo), Eugenio Ledezma (Grabación, Mezcla y Masterización), Juver Ulacio (Grabación). 
Vídeo: Gerardo Sánchez (Bandola Llanera), Miguel Magall', 0, true, '2026-09-05T02:16:43.798796+00:00', '2026-09-05T02:16:43.798796+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.recommended_videos (id, youtube_id, title, description, sort_order, is_published, created_at, updated_at) VALUES ('d58194c6-4c45-472d-b3ba-e8face8e1f01', 'HxQ-EpcZruE', 'Jose Escobar - Lo Juro Por Mis Aperos', 'Autor: Jesús León
Arpa: Freddy Sanchez
Cuatro: Nestor Fama
Maracas: Erik Prieto
Bajo: Nestor Fama
Mezcla: Néstor Fama
Dirección, Film Y Edicion de Video: Nestor Fama', 0, true, '2026-09-05T02:19:50.411583+00:00', '2026-09-05T02:19:50.411583+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.recommended_videos (id, youtube_id, title, description, sort_order, is_published, created_at, updated_at) VALUES ('e559f354-d422-46e1-a372-c05d10e1a5e0', 'EY1br0x7uQU', 'Yenifer Mora - Agradecida (Vídeo Oficial)', 'Créditos: José Vicente Arvelaez (Autor), Joseito Hernández (Arpa Llanera), Cesar Peñaranda (Bajo), Shalom Zapata (Cuatro Llanero), Edwards Borjas (Maracas Llaneras), Daniel Riera (Grabación, Mezcla y Masterización), Yenifer Mora y Joseito Hernández (Producción General).', 0, true, '2026-09-05T15:36:54.237008+00:00', '2026-09-05T15:36:54.237008+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.recommended_videos (id, youtube_id, title, description, sort_order, is_published, created_at, updated_at) VALUES ('c4fbf6ad-bbed-4d4f-84c5-3bc12486dc38', 'ppyP2sNScNw', 'Carmelo "El Pelón" Flores - Moribundo de Amor (Vídeo Oficial)', 'Créditos: William Macualo (Autor, Compositor, Productor y Arpa Llanera), Rafael Ramos (Cuatro Llanero), Sebastián Bermejo (Maracas Llaneras), Alexander Yagua (Bajo), Álvaro Ampueda (Grabación, ), Diego Hernández (Mezcla y Masterización), José Luis Cruz (Producción Audiovisual).', 0, true, '2026-09-12T20:55:35.230317+00:00', '2026-09-12T20:55:35.230317+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.recommended_videos (id, youtube_id, title, description, sort_order, is_published, created_at, updated_at) VALUES ('8ebc31c6-f64f-434a-90eb-1c433568d4fd', 'tkzG8Yy5Xo0', 'Abril Castillo - Cara de santo', NULL, 0, true, '2026-11-08T17:52:24.468459+00:00', '2026-11-08T17:52:24.468459+00:00') ON CONFLICT DO NOTHING;

-- Table: site_visits (1 records)
INSERT INTO public.site_visits (id, total, updated_at) VALUES (1, 524, '2026-11-08T21:25:37.882155+00:00') ON CONFLICT DO NOTHING;

