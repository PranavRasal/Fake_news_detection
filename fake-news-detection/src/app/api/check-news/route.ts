import { NextRequest, NextResponse } from "next/server";
import generateContent from "./generateContent";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const problemText = body.problem || body.title;
    const language = body.language || "English";
    const userLocation = body.location || "Local Jurisdiction";
    const userName = body.userName || "A Concerned Citizen";

    if (!problemText || typeof problemText !== "string" || problemText.trim().length < 3) {
      return NextResponse.json(
        { error: "Please enter a problem description with at least 3 characters." },
        { status: 400 },
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key is not configured in .env.local." },
        { status: 500 },
      );
    }

    const prompt = `You are an expert Civic and Social Problem Resolution Advisor and Legal Aid Assistant.
Analyze the citizen's problem statement below and generate a structured, highly actionable solution.

USER PROBLEM: "${problemText.trim()}"
USER LOCATION: "${userLocation}"
CITIZEN NAME: "${userName}"
REQUESTED LANGUAGE: "${language}"

IMPORTANT INSTRUCTIONS:
1. Provide all text (summary, action plan, letter, authorities, etc.) in the requested language: ${language}.
2. Categorize into ONE of:
   - "Sanitation & Waste Management"
   - "Roads & Infrastructure"
   - "Water & Electricity Supply"
   - "Public Health & Safety"
   - "Cyber & Financial Fraud"
   - "Education & Child Welfare"
   - "Environment & Pollution"
   - "Consumer Rights & Civic Welfare"
3. Assess urgency accurately:
   - "Critical": Life-threatening, immediate hazard, severe outbreak, live wires, acute fraud.
   - "High": Significant disruption, overflowing sewage for weeks, contaminated water, active harassment.
   - "Medium": Chronic neglect, damaged streetlights, delayed administrative records.
   - "Low": Minor inconveniences, routine park maintenance, informational queries.
   Provide an urgency score (0-100) and rationale.
4. Provide a 3-step practical action plan.
5. Identify specific government departments / local authorities and official complaint portals or helplines.
6. Mention relevant legal sections, acts, or constitutional rights.
7. Draft a formal, professional grievance letter / petition ready to be submitted to authorities. Include placeholders like [Your Name], [Contact Number], [Exact Address] where necessary.

Return ONLY a valid JSON object matching this schema:
{
  "summary": "Short 2-3 sentence overview of the issue and core civic impact",
  "category": "String (one of the specified categories)",
  "urgency": {
    "level": "Low" | "Medium" | "High" | "Critical",
    "score": 85,
    "reason": "Clear justification for this urgency level"
  },
  "actionPlan": [
    {
      "step": 1,
      "title": "Short title for immediate action",
      "description": "Specific action to take today (evidence collection, helpline, etc.)"
    },
    {
      "step": 2,
      "title": "Short title for authority escalation",
      "description": "Filing formal complaint with right officer / portal"
    },
    {
      "step": 3,
      "title": "Short title for legal or community follow-up",
      "description": "RTI filing, collective petition, or legal remedy if unresolved"
    }
  ],
  "authoritiesToContact": [
    {
      "name": "Designation / Department Name",
      "role": "Specific responsibility",
      "helpline": "Helpline / Portal / Address"
    }
  ],
  "applicableLawsOrSchemes": [
    "Relevant Act, Article or Government Scheme 1",
    "Relevant Act, Article or Government Scheme 2"
  ],
  "formalLetter": {
    "recipient": "The Municipal Commissioner / Ward Officer / Concerned Authority,\n[Department Name],\n[City/District]",
    "subject": "Formal Complaint Regarding ... at [Location]",
    "body": "Respected Sir/Madam,\n\nI am writing to bring to your urgent attention...",
    "callToAction": "Requested action and turnaround time (e.g., immediate inspection within 48 hours)."
  }
}`;

    const rawResponse = await generateContent(prompt, {
      responseMimeType: "application/json",
    });

    let parsedData;
    try {
      const cleanJson = String(rawResponse)
        .replace(/^```json\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      parsedData = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.warn("Failed to parse JSON response directly, creating fallback", parseErr);
      parsedData = {
        summary: String(rawResponse).slice(0, 300),
        category: "Civic & Social Welfare",
        urgency: {
          level: "Medium",
          score: 60,
          reason: "Standard civic issue requiring administrative attention.",
        },
        actionPlan: [
          {
            step: 1,
            title: "Document Evidence",
            description: "Take geotagged photos and keep timestamps of the issue.",
          },
          {
            step: 2,
            title: "File Official Complaint",
            description: "Submit a written grievance to your local administrative department.",
          },
          {
            step: 3,
            title: "Follow-up & Escalation",
            description: "If unaddressed in 7 days, file an RTI or escalate to higher authorities.",
          },
        ],
        authoritiesToContact: [
          {
            name: "Local Municipal Corporation / District Administration",
            role: "Grievance Redressal Officer",
            helpline: "National Portal / Local Ward Office",
          },
        ],
        applicableLawsOrSchemes: [
          "Citizen's Charter & Public Grievance Redressal Guidelines",
        ],
        formalLetter: {
          recipient: "To The Concerned Officer,\n[Local Ward / Department],\n[City]",
          subject: `Grievance regarding: ${problemText.slice(0, 50)}`,
          body: String(rawResponse),
          callToAction: "Requesting prompt inspection and remediation.",
        },
      };
    }

    // Build backward-compatible claims for legacy checks
    const legacyClaims = [
      {
        text: parsedData.summary,
        rating: `Category: ${parsedData.category}`,
        publisher: `Urgency: ${parsedData.urgency?.level || "Medium"} (${parsedData.urgency?.score || 50}/100)`,
        url: "#",
      },
      ...(parsedData.actionPlan || []).map((item: { step: number; title: string; description: string }) => ({
        text: `Step ${item.step}: ${item.title} - ${item.description}`,
        rating: "Action Step",
        publisher: "Civic Resolution",
        url: "#",
      })),
    ];

    return NextResponse.json({
      title: problemText.trim(),
      language,
      summary: parsedData.summary,
      category: parsedData.category || "General Civic Welfare",
      urgency: parsedData.urgency || { level: "Medium", score: 50, reason: "Evaluated by AI" },
      actionPlan: parsedData.actionPlan || [],
      authoritiesToContact: parsedData.authoritiesToContact || [],
      applicableLawsOrSchemes: parsedData.applicableLawsOrSchemes || [],
      formalLetter: parsedData.formalLetter || null,
      claims: legacyClaims,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Civic problem processing failed:", error);
    return NextResponse.json(
      { error: "Something went wrong while processing the problem. Please verify your API key or input." },
      { status: 500 },
    );
  }
}
