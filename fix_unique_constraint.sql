-- Drop the old incorrect unique constraint
ALTER TABLE public.user_picks DROP CONSTRAINT IF EXISTS user_picks_user_id_game_id_key;

-- Add the correct unique constraint that includes prediction_type
ALTER TABLE public.user_picks ADD CONSTRAINT user_picks_user_id_game_id_prediction_type_key 
    UNIQUE(user_id, game_id, prediction_type);
