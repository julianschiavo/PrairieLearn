import { z } from 'zod';

import { loadSqlEquiv, queryOptionalRow } from '@prairielearn/postgres';

import { IdSchema } from './db-types.js';

const sql = loadSqlEquiv(import.meta.url);

export const InstanceQuestionContextSchema = z.object({
  question_id: IdSchema,
  group_id: IdSchema.nullable(),
  user_id: IdSchema.nullable(),
  assessment_instance_id: IdSchema,
  assessment_id: IdSchema,
  course_instance_id: IdSchema,
  instance_question_open: z.boolean().nullable(),
  assessment_instance_open: z.boolean().nullable(),
});

export type InstanceQuestionContext = z.infer<typeof InstanceQuestionContextSchema>;

export async function selectInstanceQuestionContext(
  instance_question_id: string,
): Promise<InstanceQuestionContext | null> {
  return await queryOptionalRow(
    sql.select_instance_question_context,
    { instance_question_id },
    InstanceQuestionContextSchema,
  );
}
