import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log(
      "FULL VAPI BODY:",
      JSON.stringify(body, null, 2)
    );

    // Get the tool call from Vapi
    const toolCall =
      body.message?.toolCalls?.[0] ||
      body.message?.toolCallList?.[0];

    if (!toolCall) {
      console.log("NO TOOL CALL FOUND");

      return NextResponse.json(
        {
          success: false,
          error: "No tool call found"
        },
        {
          status: 400
        }
      );
    }


    // Vapi stores arguments here
    const args =
      toolCall.function?.arguments ||
      toolCall.arguments;


    console.log(
      "ORDER DATA:",
      args
    );


    if (!args) {
      return NextResponse.json(
        {
          success: false,
          error: "No order arguments found"
        },
        {
          status: 400
        }
      );
    }


    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          customer_name: args.customer_name,
          phone: args.phone,
          items: args.items,
          status: "New",
          order_time: new Date().toISOString()
        }
      ])
      .select();


    if (error) {
      console.log(
        "SUPABASE ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        {
          status: 500
        }
      );
    }


    console.log(
      "ORDER SAVED:",
      data
    );


    return NextResponse.json(
      {
        success: true,
        order: data[0]
      }
    );


  } catch (error: any) {

    console.log(
      "API ERROR:",
      error
    );


    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      {
        status: 500
      }
    );
  }
}