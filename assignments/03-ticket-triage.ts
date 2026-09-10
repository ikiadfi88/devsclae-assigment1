import { Pipeline } from "@anvia/core/pipeline";
import { generateCompletion } from "@anvia/core";
import { model } from "../src/model.js";
import z from "zod";

const TicketInputSchema = z.object({
  ticket: z.string(),
});

const TicketSchema = z.object({
  category: z.enum(["billing", "technical", "general"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  summary: z.string(),
});

const RoutedTicketSchema = TicketSchema.extend({
  route: z.string(),
  assignedTeam: z.string(),
  slaHours: z.number(),
});

const EXTRACT_INSTRUCTION = `
You are a ticket triage specialist. Extract structured information from the support ticket.

Classify the ticket into:
- category: "billing" | "technical" | "general"
- priority: "low" | "medium" | "high" | "urgent"
- summary: A concise 1-2 sentence summary of the issue

Guidelines:
- billing: Payment, refunds, invoices, subscriptions, pricing
- technical: Bugs, errors, performance, integration, API issues
- general: Feature requests, account questions, how-to, feedback

Priority guidelines:
- urgent: System down, data loss, security breach, production outage
- high: Major feature broken, significant user impact, no workaround
- medium: Minor issue, workaround exists, single user affected
- low: Cosmetic, enhancement, non-critical question
`;

const ticketTriagePipeline = new Pipeline({
  id: "ticket-triage",
  inputSchema: TicketInputSchema,
})
  .step({
    id: "extract",
    run: async (context) => {
      const result = await generateCompletion({
        model,
        instructions: EXTRACT_INSTRUCTION,
        prompt: `Support ticket:\n${context.input.ticket}`,
        outputSchema: TicketSchema,
      });
      return result.output;
    },
  })
  .step({
    id: "route",
    run: async (context) => {
      const ticket = context.input;

      let route: string;
      let assignedTeam: string;
      let slaHours: number;

      if (ticket.priority === "urgent") {
        route = "escalation";
        assignedTeam = "escalation-team";
        slaHours = 1;
      } else if (ticket.priority === "high") {
        route = "senior-support";
        assignedTeam = "senior-support-team";
        slaHours = 4;
      } else if (ticket.priority === "medium") {
        route = "general-support";
        assignedTeam = "general-support-team";
        slaHours = 24;
      } else {
        route = "self-service";
        assignedTeam = "self-service-portal";
        slaHours = 72;
      }

      if (ticket.category === "billing" && ticket.priority !== "urgent") {
        route = "billing-support";
        assignedTeam = "billing-team";
        slaHours = Math.min(slaHours, 8);
      } else if (ticket.category === "technical" && ticket.priority === "high") {
        route = "engineering-escalation";
        assignedTeam = "engineering-team";
        slaHours = 2;
      }

      return {
        ...ticket,
        route,
        assignedTeam,
        slaHours,
      } satisfies z.infer<typeof RoutedTicketSchema>;
    },
  });

const sampleTickets = [
  "URGENT: Production API is returning 500 errors for all users! We're losing revenue every minute. This started 10 minutes ago.",
  "I was charged twice for my subscription this month. Can you please refund the duplicate charge? Invoice #INV-2024-001234",
  "How do I export my data to CSV? The documentation doesn't mention this feature.",
  "The mobile app crashes when I try to upload a profile picture larger than 5MB. iPhone 15, iOS 17.2",
  "Feature request: Add dark mode support to the dashboard. Many users have been asking for this.",
  "Critical security issue: I can access other users' data by changing the user_id parameter in the API call!",
];

async function runTriage() {
  console.log("=== TICKET TRIAGE RESULTS ===\n");

  for (const ticketText of sampleTickets) {
    const result = await ticketTriagePipeline.run({
      input: { ticket: ticketText },
    });

    console.log(`--- Ticket: ${ticketText.substring(0, 60)}... ---`);
    console.log(`Category: ${result.output.category}`);
    console.log(`Priority: ${result.output.priority}`);
    console.log(`Summary: ${result.output.summary}`);
    console.log(`Route: ${result.output.route}`);
    console.log(`Assigned Team: ${result.output.assignedTeam}`);
    console.log(`SLA: ${result.output.slaHours} hours`);
    console.log("");
  }
}

await runTriage();
