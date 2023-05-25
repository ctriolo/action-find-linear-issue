import { Issue, LinearClient, Team } from "@linear/sdk";

const addLabels = async (
  linearClient: LinearClient,
  issue: Issue,
  labelIds: string[]
): Promise<void> => {
  if (!labelIds.length) {
    return;
  }

  await linearClient.issueUpdate(issue.id, {
    labelIds: labelIds,
  });
};

export default addLabels;
