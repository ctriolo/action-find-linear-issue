import { Issue, LinearClient, Team } from "@linear/sdk";
import { uniq } from "lodash";


const addLabels = async (
  linearClient: LinearClient,
  issue: Issue,
  newLabelIds: string[]
): Promise<void> => {
  if (!newLabelIds.length) {
    return;
  }
  const oldLabels = await issue.labels();
  const oldLabelIds = oldLabels.nodes.map((label) => label.id);
  const labelIds = uniq([...oldLabelIds, ...newLabelIds]);
  await linearClient.issueUpdate(issue.id, {
    labelIds: labelIds,
  });
};

export default addLabels;
