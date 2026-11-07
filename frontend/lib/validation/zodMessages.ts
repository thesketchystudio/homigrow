// lib/validation/zodMessages.ts
// App-wide wording for validation errors a schema did not word itself.
// Without it, an untouched dropdown or an empty number field shows zod's
// technical text ("Invalid input: expected string, received undefined").
// Importing this module registers the wording; a message written on a field
// always takes precedence over it.

import { z } from "zod";

z.config({
  customError: (issue) => {
    if (issue.code === "invalid_type") {
      if (issue.input === undefined || issue.input === null) return "This field is required.";
      if (issue.expected === "number") return "Enter a valid number.";
      return "Enter a valid value.";
    }
    return undefined;
  },
});
