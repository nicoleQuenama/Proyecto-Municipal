import { Icon } from "../viewport/icons";

export const BranchIcon = () => (
  <Icon>
    <circle cx="6" cy="5" r="2" />
    <circle cx="6" cy="19" r="2" />
    <circle cx="18" cy="9" r="2" />
    <path d="M6 7v10M18 11c0 4-6 3-12 6" />
  </Icon>
);

export const CommitIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="3" />
    <path d="M3 12h6M15 12h6" />
  </Icon>
);

export const PullRequestIcon = () => (
  <Icon>
    <circle cx="6" cy="5" r="2" />
    <circle cx="6" cy="19" r="2" />
    <circle cx="18" cy="19" r="2" />
    <path d="M6 7v10M18 17V9a3 3 0 00-3-3h-3M14 3l-2 3 2 3" />
  </Icon>
);

export const IssueIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5M12 16h.01" />
  </Icon>
);

export const CheckIcon = () => (
  <Icon><path d="M5 12l5 5 9-10" /></Icon>
);

export const AlertIcon = () => (
  <Icon>
    <path d="M12 3l10 18H2z" />
    <path d="M12 10v4M12 17h.01" />
  </Icon>
);
