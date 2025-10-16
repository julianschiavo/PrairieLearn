import { type User, type Variant } from '../lib/db-types.js';
import { getGroupConfig, getGroupInfo } from '../lib/groups.js';
import { selectInstanceQuestionContext } from '../lib/instance-question-context.js';
import { selectUserById } from '../models/user.js';

import {
  type QuestionServerGenerateContext,
  type QuestionServerGroupInfo,
  type QuestionServerGroupMemberInfo,
  type QuestionServerUserInfo,
} from './types.js';

interface BuildViewerContextOptions {
  questionIsShared: boolean;
  userId?: string | null;
  preloadedUser?: User | null;
  variant?: Variant | null;
  assessmentId?: string | null;
  groupId?: string | null;
}

export interface ViewerContext {
  user: QuestionServerUserInfo | null;
  group: QuestionServerGroupInfo | null;
}

function sanitizeUser(user: User): QuestionServerUserInfo {
  return {
    user_id: user.user_id,
    uid: user.uid,
    name: user.name,
    email: user.email,
  };
}

function sanitizeGroupMember(member: User, roles: string[]): QuestionServerGroupMemberInfo {
  return {
    ...sanitizeUser(member),
    roles,
  };
}

async function resolveUser(
  options: BuildViewerContextOptions,
): Promise<QuestionServerUserInfo | null> {
  if (options.preloadedUser) {
    return sanitizeUser(options.preloadedUser);
  }

  const userId = options.userId ?? options.variant?.user_id ?? null;
  if (!userId) return null;

  const user = await selectUserById(userId);
  return sanitizeUser(user);
}

async function resolveGroup(
  options: BuildViewerContextOptions,
): Promise<QuestionServerGroupInfo | null> {
  let groupId = options.groupId ?? options.variant?.group_id ?? null;
  let assessmentId = options.assessmentId ?? null;
  if ((!groupId || !assessmentId) && options.variant?.instance_question_id) {
    const context = await selectInstanceQuestionContext(options.variant.instance_question_id);
    if (context) {
      assessmentId = assessmentId ?? context.assessment_id;
      groupId = groupId ?? context.group_id;
    }
  }

  if (!groupId || !assessmentId) return null;

  const groupConfig = await getGroupConfig(assessmentId);
  const groupInfo = await getGroupInfo(groupId, groupConfig);

  const roleAssignments = groupInfo.rolesInfo?.roleAssignments ?? {};
  const members = groupInfo.groupMembers.map((member) =>
    sanitizeGroupMember(
      member,
      (roleAssignments[member.uid] ?? []).map((assignment) => assignment.role_name),
    ),
  );

  return {
    group_id: groupId,
    name: groupInfo.groupName,
    members,
    size: groupInfo.groupSize,
    start: groupInfo.start,
  };
}

export async function buildViewerContext(
  options: BuildViewerContextOptions,
): Promise<ViewerContext> {
  if (options.questionIsShared) {
    return { user: null, group: null };
  }

  const [user, group] = await Promise.all([resolveUser(options), resolveGroup(options)]);

  return { user, group };
}

export function buildViewerContextFromGenerate(
  questionIsShared: boolean,
  context: QuestionServerGenerateContext | undefined,
): Promise<ViewerContext> {
  return buildViewerContext({
    questionIsShared,
    userId: context?.userId ?? null,
    groupId: context?.groupId ?? null,
    assessmentId: context?.assessmentId ?? null,
  });
}
