import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/serverSupabase";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log(
      "FULL BODY:",
      JSON.stringify(body, null, 2)
    );

    let args: any = null;


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


    // Direct testing
    else {
      args = body;
    }


    // Vapi sometimes sends JSON as text
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
        "MISSING ORDER DATA:",
        args
      );


      return NextResponse.json(
        {
          success: false,
          message: "Missing order information"
        },
        {
          status: 400,
          headers: corsHeaders,
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
          order_time: new Date().toISOString(),
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
          message: "Unable to save order",
          error: error.message
        },
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }



    console.log(
      "ORDER SAVED:",
      data
    );



    // IMPORTANT: VAPI READS THIS
    return NextResponse.json(
      {
        success: true,
        message: "Order placed successfully",
        order_id: data.id
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );



  } catch(error:any) {

    console.log(
      "API ERROR:",
      error
    );


    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        error: error.message
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}