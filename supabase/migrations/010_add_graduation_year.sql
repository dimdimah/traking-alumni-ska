ALTER TABLE profiles ADD COLUMN graduation_year integer;

CREATE TABLE tracer_study_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES tracer_study_questions(id) ON DELETE CASCADE NOT NULL,
  answer_text text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, question_id)
);

ALTER TABLE tracer_study_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own answers"
  ON tracer_study_answers
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
