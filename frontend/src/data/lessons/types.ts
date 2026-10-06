export interface Task {
  id: string;
  prompt: string;
  hint?: string;
  solutionQuery: string;
  orderMatters?: boolean;
  /** If set, this task is a mutation. Validation runs the student's query,
   *  then this probe, and compares against the same probe run after the
   *  solution query. */
  probeQuery?: string;
}

export interface Lesson {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  content: string;
  didYouKnow?: string;
  defaultQuery: string;
  tasks: Task[];
  showSchema?: boolean;
}