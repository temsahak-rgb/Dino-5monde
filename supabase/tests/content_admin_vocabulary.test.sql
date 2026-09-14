begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

select has_function('public', 'vocabulary_pack_validation_errors', array['text','jsonb'], 'Vocabulary publication has a server validator');
select has_trigger('public', 'content_items', 'validate_vocabulary_publication', 'Vocabulary publication has its own immutable-identity guard');
select ok('payload_invalid' = any(public.vocabulary_pack_validation_errors('test', '[]'::jsonb)), 'non-object payloads are rejected deterministically');
select ok('content_identity_mismatch' = any(public.vocabulary_pack_validation_errors('expected', jsonb_build_object('catalog', jsonb_build_object('id','other','title','Test','words',1), 'document', jsonb_build_object('id','other','title','Test','level','A1','words',jsonb_build_array(jsonb_build_object('fr','bonjour','fa','سلام')))))), 'catalog and document identity must match');
select ok('word_duplicate' = any(public.vocabulary_pack_validation_errors('test', jsonb_build_object('catalog', jsonb_build_object('id','test','title','Test','words',2), 'document', jsonb_build_object('id','test','title','Test','level','A1','words',jsonb_build_array(jsonb_build_object('fr','Bonjour','fa','سلام'),jsonb_build_object('fr',' bonjour ','fa','درود')))))), 'French word identity is unique after normalization');
select ok('question_answer_invalid' = any(public.vocabulary_pack_validation_errors('test', jsonb_build_object('catalog', jsonb_build_object('id','test','title','Test','words',1), 'document', jsonb_build_object('id','test','title','Test','level','A1','words',jsonb_build_array(jsonb_build_object('fr','bonjour','fa','سلام')),'quiz',jsonb_build_object('displayCount',1,'questions',jsonb_build_array(jsonb_build_object('question','Q','options',jsonb_build_array('A','B'),'correctIndex',4))))))), 'quiz answer indexes stay inside their options');
select is(public.vocabulary_pack_validation_errors('test', jsonb_build_object('catalog', jsonb_build_object('id','test','title','Test','words',1), 'document', jsonb_build_object('id','test','theme','Test','level','A1','words',jsonb_build_array(jsonb_build_object('fr','bonjour','fa','سلام')),'quiz',jsonb_build_object('displayCount',1,'questions',jsonb_build_array(jsonb_build_object('type','binary','question','Bonjour signifie salut.','options',jsonb_build_array('Vrai','Faux'),'correctIndex',0)))))), array[]::text[], 'a complete modern pack is accepted');

insert into auth.users (id,aud,role,email,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','authenticated','authenticated','vocabulary-editor@example.test','{}','{}',now(),now());
insert into public.content_admins (user_id) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee');
set local role authenticated;
set local "request.jwt.claim.sub" = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
select lives_ok($$ select * from public.admin_import_content_draft('vocabulary_pack','test-pack',1,'A1','Test pack',null,jsonb_build_object('catalog',jsonb_build_object('id','test-pack','title','Test pack','words',1),'document',jsonb_build_object('id','test-pack','theme','Test pack','level','A1','words',jsonb_build_array(jsonb_build_object('fr','bonjour','fa','')))),'admin-panel') $$, 'an incomplete Vocabulary pack may remain a private draft');
select throws_ok($$ select * from public.admin_publish_content_revision('vocabulary_pack','test-pack',1) $$,'22023','vocabulary_pack_not_publishable','an invalid Vocabulary draft cannot become public');
rollback;
