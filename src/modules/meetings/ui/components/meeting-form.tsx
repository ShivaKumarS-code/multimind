import { MeetingGetOne } from "../../types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"
import { meetingsInsertSchema } from "../../schemas"
import { useForm } from "react-hook-form"
import z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
    Form,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
    FormField,
    FormDescription,
} from "@/components/ui/form"
import { toast } from "sonner"
import { useState } from "react"
import { CommandSelect } from "@/components/command-select"
import { GeneratedAvatar } from "@/components/generated-avatar"
import { Divide } from "lucide-react"
import { NewAgentDialog } from "@/modules/agents/ui/components/new-agent-dialog"

interface MeetingFormProps {
    onSuccess?: (id?: string)=> void
    onCancel?: () => void
    initialValues?: MeetingGetOne
}

export const MeetingForm = ({ onSuccess, onCancel, initialValues }: MeetingFormProps) => {
    const trpc = useTRPC()
    const queryClient = useQueryClient()
    const [agentsearch, setAgentSearch] = useState("")
    const [openNewAgentDialog, setOpenNewAgentDialog] = useState(false)

    const agents = useQuery(
        trpc.agents.getMany.queryOptions({
            pageSize: 100,
            search: agentsearch
        })
    )

    const createMeeting = useMutation(trpc.meetings.create.mutationOptions({
        onSuccess: async (data) => {
           await queryClient.invalidateQueries(
                trpc.meetings.getMany.queryOptions({}),
            )
                onSuccess?.(data.id)
        },
        onError: (error) => {
            toast.error(error.message)
        }
    }))

    const updateMeeting = useMutation(trpc.meetings.update.mutationOptions({
        onSuccess: async () => {
           await queryClient.invalidateQueries(
                trpc.meetings.getMany.queryOptions({}),
            )
              if(initialValues?.id) {
              await queryClient.invalidateQueries(
                    trpc.meetings.getOne.queryOptions({ id: initialValues.id }),
                )
              }
                onSuccess?.()
        },
        onError: (error) => {
            toast.error(error.message)
        }
    }))


    const form = useForm<z.infer<typeof meetingsInsertSchema>>({
        resolver: zodResolver(meetingsInsertSchema),
        defaultValues: {
            name: initialValues?.name ?? "",
            agentId : initialValues?.agentId ?? "",
        }
    })
      const isEdit = !!initialValues?.id
      const isPending = createMeeting.isPending || updateMeeting.isPending

      const onSubmit = (values: z.infer<typeof meetingsInsertSchema>) => {
        if(isEdit) {
            updateMeeting.mutate({ ...values, id: initialValues.id })
        } else {
            createMeeting.mutate(values)
        }
      }

        return (
        <>
          <NewAgentDialog open={openNewAgentDialog} onOpenChange={setOpenNewAgentDialog} />
            <Form {...form}>
                <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                    <FormField
                        control={form.control} 
                        name='name'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="e.g. Math Consultations" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                       />

                        <FormField
                        control={form.control} 
                        name='agentId'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Agent</FormLabel>
                                <FormControl>
                                    <CommandSelect 
                                      options={(agents.data?.items ?? []).map((agent) => ({
                                         id: agent.id,
                                         value: agent.id,
                                         children: (
                                            <div className="flex items-center gap-x-2">
                                                <GeneratedAvatar 
                                                   seed={agent.name}
                                                   variant="botttsNeutral"
                                                   className="border size-6"
                                                />
                                                <span>{agent.name}</span>
                                            </div>
                                         )
                                      }))} 
                                       onSelect={field.onChange}
                                       onSearch={setAgentSearch}
                                       value={field.value}
                                       placeholder="Select an Agent"
                                    />
                                </FormControl>
                                <FormDescription>
                                    Not found what you are looking for?{' '}
                                    <button type="button" className="text-primary hover:underline" onClick={() => setOpenNewAgentDialog(true)}>
                                        Create new agent
                                    </button>
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                       />

                       <div className="flex justify-between gap-x-2">
                         {onCancel && (
                            <Button variant="ghost" type="button" onClick={onCancel} disabled={isPending}>
                                Cancel
                            </Button>
                         )}
                         <Button type="submit" disabled={isPending}>
                             {isEdit ? "Update" : "Create"}</Button>
                       </div>
                </form>
            </Form>
        </>

        )
}
