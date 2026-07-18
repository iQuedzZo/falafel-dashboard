import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/serverSupabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log(
      "FULL BODY:",
      JSON.stringify(body, null, 2)
    );

    let args: any;


    // New Vapi format
    if (body.message?.toolCalls?.[0]) {
      const toolCall = body.message.toolCalls[0];

      args =
        toolCall.function?.arguments ||
        toolCall.arguments;
    }


    // Older Vapi format
    else if (body.message?.toolCallList?.[0]) {
      const toolCall = body.message.toolCallList[0];

      args =
        toolCall.function?.arguments ||
        toolCall.arguments;
    }


    // Direct testing / curl
    else {
      args = body;
    }


    // Sometimes Vapi sends arguments as a string
    if (typeof args === "string") {
      args = JSON.parse(args);
    }


    console.log(
      "ORDER DATA:",
      args
    );


    if (
      !args?.customer_name ||
      !args?.phone ||
      !args?.items
    ) {

      console.log(
        "MISSING DATA:",
        args
      );

      return NextResponse.json(
        {
          success: false,
          message: "Missing customer name, phone, or items"
        },
        {
          status: 400
        }
      );
    }



    const { data, error } = await serverSupabase
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
      .select()
      .single();



    if (error) {

      console.log(
        "SUPABASE ERROR:",
        error
      );


      return NextResponse.json(
        {
          success: false,
          message: "Database failed to save order",
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



    // IMPORTANT FOR VAPI
    return NextResponse.json(
      {
        success: true,
        message: "Order saved successfully",
        order_id: data.id
      },
      {
        status: 200
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
        message: "Unexpected server error",
        error: error.message
      },
      {
        status: 500
      }
    );

  }
}