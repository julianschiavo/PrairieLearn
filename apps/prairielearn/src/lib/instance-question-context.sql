-- BLOCK select_instance_question_context
SELECT
  aq.question_id,
  ai.group_id,
  ai.user_id,
  iq.assessment_instance_id,
  ai.assessment_id,
  a.course_instance_id,
  iq.open AS instance_question_open,
  ai.open AS assessment_instance_open
FROM
  instance_questions AS iq
  JOIN assessment_questions AS aq ON (aq.id = iq.assessment_question_id)
  JOIN assessment_instances AS ai ON (ai.id = iq.assessment_instance_id)
  JOIN assessments AS a ON (a.id = ai.assessment_id)
WHERE
  iq.id = $instance_question_id;
