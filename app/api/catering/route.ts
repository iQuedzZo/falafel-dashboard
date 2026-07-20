import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type CateringArguments = {
  customer_name?: string;
  phone?: string;
  email?: string;
  event_date?: string;
  event_time?: string;
  event_type?: string;
  guest_count?: number;
  menu_requests?: string;
  delivery_address?: string;
  estimated_budget?: number;
  fulfillment_type?: "pickup" | "delivery";
  setup_requirements?: string;
  dietary_restrictions?: string;
  special_instructions?: string;
  preferred_callback_time?: string;
};

type VapiToolCall = {
  id?: string;
  name?: string;
  arguments?: CateringArguments;
  parameters?: CateringArguments;
  function?: {
    name?: string;
    arguments?: CateringArguments | string;
  };
};

function cleanOptionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}

function getArguments(toolCall: VapiToolCall): CateringArguments {
  if (toolCall.arguments && typeof toolCall.arguments === "object") {
    return toolCall.arguments;
  }

  if (toolCall.parameters && typeof toolCall.parameters === "object") {
    return toolCall.parameters;
  }

  const functionArguments = toolCall.function?.arguments;

  if (typeof functionArguments === "string") {
    try {
      return JSON.parse(functionArguments) as CateringArguments;
    } catch {
      return {};
    }
  }

  if (functionArguments && typeof functionArguments === "object") {
    return functionArguments;
  }

  return {};
}

function vapiResponse(
  toolCallId: string,
  message: string,
  isError = false
) {
  return NextResponse.json(
    {
      results: [
        isError
          ? {
              toolCallId,
              error: message.replace(/\s+/g, " ").trim(),
            }
          : {
              toolCallId,
              result: message.replace(/\s+/g, " ").trim(),
            },
      ],
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  let toolCallId = "unknown-tool-call";

  try {
    const body = await request.json();

    const toolCall: VapiToolCall | undefined =
      body?.message?.toolCallList?.[0] ??
      body?.message?.toolWithToolCallList?.[0]?.toolCall ??
      body?.toolCallList?.[0];

    if (!toolCall) {
      return vapiResponse(
        toolCallId,
        "The catering request could not be processed because no tool call was received.",
        true
      );
    }

    toolCallId = toolCall.id ?? toolCallId;

    const args = getArguments(toolCall);

    const customerName = cleanOptionalText(args.customer_name);
    const phone = cleanOptionalText(args.phone);
    const eventDate = cleanOptionalText(args.event_date);
    const menuRequests = cleanOptionalText(args.menu_requests);
    const fulfillmentType = cleanOptionalText(args.fulfillment_type);
    const deliveryAddress = cleanOptionalText(args.delivery_address);

    const guestCount = Number(args.guest_count);

    if (!customerName) {
      return vapiResponse(
        toolCallId,
        "The customer's name is missing. Ask for the customer's full name and try again.",
        true
      );
    }

    if (!phone) {
      return vapiResponse(
        toolCallId,
        "The callback phone number is missing. Ask for and confirm the phone number before trying again.",
        true
      );
    }

    if (!eventDate) {
      return vapiResponse(
        toolCallId,
        "The exact event date is missing. Confirm the event date and try again.",
        true
      );
    }

    if (!Number.isInteger(guestCount) || guestCount <= 0) {
      return vapiResponse(
        toolCallId,
        "The guest count must be a whole number greater than zero.",
        true
      );
    }

    if (
      fulfillmentType !== "pickup" &&
      fulfillmentType !== "delivery"
    ) {
      return vapiResponse(
        toolCallId,
        "The fulfillment type must be either pickup or delivery.",
        true
      );
    }

    if (fulfillmentType === "delivery" && !deliveryAddress) {
      return vapiResponse(
        toolCallId,
        "A complete delivery address is required for delivery catering requests.",
        true
      );
    }

    if (!menuRequests) {
      return vapiResponse(
        toolCallId,
        "The requested catering food or package information is missing.",
        true
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase server environment variables.");

      return vapiResponse(
        toolCallId,
        "The catering system is temporarily unavailable. Please ask restaurant staff for assistance.",
        true
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await supabase
      .from("catering_requests")
      .insert({
        customer_name: customerName,
        phone,
        email: cleanOptionalText(args.email),
        event_date: eventDate,
        event_time: cleanOptionalText(args.event_time),
        event_type: cleanOptionalText(args.event_type),
        guest_count: guestCount,
        menu_requests: menuRequests,
        delivery_address:
          fulfillmentType === "delivery" ? deliveryAddress : null,
        estimated_budget:
          typeof args.estimated_budget === "number" &&
          args.estimated_budget >= 0
            ? args.estimated_budget
            : null,
        fulfillment_type: fulfillmentType,
        setup_requirements: cleanOptionalText(args.setup_requirements),
        dietary_restrictions: cleanOptionalText(
          args.dietary_restrictions
        ),
        special_instructions: cleanOptionalText(
          args.special_instructions
        ),
        preferred_callback_time: cleanOptionalText(
          args.preferred_callback_time
        ),
        status: "new",
        source: "vapi",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Catering insert failed:", error);

      return vapiResponse(
        toolCallId,
        "The catering request could not be saved. Please ask restaurant staff for assistance.",
        true
      );
    }

    console.log("Catering request created:", data.id);

    return vapiResponse(
      toolCallId,
      "The catering request was submitted successfully for restaurant review. Staff will follow up to confirm availability and pricing."
    );
  } catch (error) {
    console.error("Unexpected catering API error:", error);

    return vapiResponse(
      toolCallId,
      "The catering request could not be processed because of a temporary system error.",
      true
    );
  }
}