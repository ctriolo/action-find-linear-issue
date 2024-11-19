import { debug, setFailed, getInput, setOutput } from "@actions/core";
import { Issue, LinearClient, Team } from "@linear/sdk";
import { context } from "@actions/github";
import getTeams from "./getTeams";
import getIssueByTeamAndNumber from "./getIssueByTeamAndNumber";
import addLabels from "./addLabels";

const getIdsFromInput = (input: string): string[] => {
  if (!input.trim()) {
    return [];
  }
  return input.split(",").map((id) => id.trim());
};

const main = async () => {
  try {
    const prTitle: string = context?.payload?.pull_request?.title;
    debug(`PR Title: ${prTitle}`);
    if (!prTitle) {
      setFailed(`Could not load PR title`);
      return;
    }

    const prBranch: string = context.payload.pull_request?.head.ref;
    debug(`PR Branch: ${prBranch}`);
    if (!prBranch) {
      setFailed(`Could not load PR branch`);
      return;
    }

    const prBody = context?.payload?.pull_request?.body;
    debug(`PR Body: ${prBody}`);
    if (prBranch === undefined) {
      setFailed(`Could not load PR body`);
      return;
    }

    const apiKey = getInput("linear-api-key", { required: true });
    const linearClient = new LinearClient({ apiKey });
    const teams = await getTeams(linearClient);
    if (teams.length === 0) {
      setFailed(`No teams found in Linear workspace`);
      return;
    }

    const labelIds = getIdsFromInput(getInput("linear-issue-label-ids"));
    for (const team of teams) {
      // TODO: Iterate over multiple matches and not just first match
      const regexString = `${team.key}-(?<issueNumber>\\d+)`;
      const regex = new RegExp(regexString, "gim");
      const haystack = prBranch + " " + prTitle + " " + prBody;
      debug(`Checking PR for indentifier "${regexString}" in "${haystack}"`);
      const check = regex.exec(haystack);
      const issueNumber = check?.groups?.issueNumber;

      if (issueNumber) {
        debug(`Found issue number: ${issueNumber}`);
        const issue = await getIssueByTeamAndNumber(
          linearClient,
          team,
          Number(issueNumber),
        );
        if (issue) {
          addLabels(linearClient, issue, labelIds);
          setOutput("linear-team-id", team.id);
          setOutput("linear-team-key", team.key);
          setOutput("linear-issue-id", issue.id);
          setOutput("linear-issue-number", issue.number);
          setOutput("linear-issue-identifier", issue.identifier);
          setOutput("linear-issue-url", issue.url);
          setOutput("linear-issue-title", issue.title);
          setOutput("linear-issue-description", issue.description);
          return;
        }
      }
    }

    setFailed(
      `Failed to find Linear issue identifier in PR branch, title, or body.`,
    );
    return;
  } catch (error) {
    setFailed(`${(error as any)?.message ?? error}`);
  }
};

main();
