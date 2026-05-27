import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import OfficerCalendarForm from "./OfficerCalendarForm.jsx";

export default function OfficerCreateEvent({
  open,
  onOpenChange,
  selectedDate,
  onCreated,
}) {
  const [openPublishDialog, setOpenPublishDialog] = useState(false);
  const [openCloseDialog, setOpenCloseDialog] = useState(false);
  const [submitRef, setSubmitRef] = useState(() => async () => {});
  const dialogLayerRef = useRef(null);

  function handleRequestClose() {
    setOpenCloseDialog(true);
  }

  function handleConfirmClose() {
    setOpenCloseDialog(false);
    setOpenPublishDialog(false);
    onOpenChange(false);
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!value) {
            handleRequestClose();
            return;
          }

          onOpenChange(true);
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-7xl">
          <div
            ref={dialogLayerRef}
            className="relative overflow-visible px-6 py-6"
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#3D398C]">
                Create Event
              </DialogTitle>
              <DialogDescription>
                Create an alumni calendar event for{" "}
                {new Date(selectedDate || new Date()).toLocaleDateString(
                  "en-PH",
                  {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }
                )}
                .
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 overflow-visible">
              <OfficerCalendarForm
                mode="create"
                selectedDate={selectedDate}
                onCreated={onCreated}
                onClose={handleRequestClose}
                finalButtonLabel="Publish Event"
                getTimePickerContainer={() => dialogLayerRef.current}
                onFinalSubmit={(submitFn) => {
                  setSubmitRef(() => submitFn);
                  setOpenPublishDialog(true);
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={openPublishDialog} onOpenChange={setOpenPublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish this event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will save the event and publish it to the selected
              destinations.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await submitRef("publish");
              }}
              className="bg-[#3D398C] text-white hover:bg-[#2f2b73]"
            >
              Publish Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={openCloseDialog} onOpenChange={setOpenCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
            <AlertDialogDescription>
              Any unsaved changes in this event form will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClose}
              className="bg-[#3D398C] text-white hover:bg-[#2f2b73]"
            >
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}